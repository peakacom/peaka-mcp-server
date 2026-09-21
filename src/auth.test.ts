import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  SignJWT,
  exportJWK,
  generateKeyPair,
  createLocalJWKSet,
  type JWTVerifyGetKey,
  type JWK,
  type KeyLike,
} from "jose";
import {
  verifyAccessToken,
  createAuthenticator,
  TokenError,
  type AuthConfig,
} from "./auth";

const ISSUER = "https://issuer.test";
const AUDIENCE = "https://resource.test";
const KID = "test-key-1";

const config: AuthConfig = {
  issuer: ISSUER,
  jwksUri: "https://issuer.test/oauth2/jwks",
  requiredScope: "user_access",
};

let privateKey: KeyLike; // signing key whose public half is in the JWKS
let keySet: JWTVerifyGetKey; // JWKS containing only the "good" key
let otherPrivateKey: KeyLike; // a key NOT in the JWKS, for signature-failure tests

beforeAll(async () => {
  const good = await generateKeyPair("RS256", { extractable: true });
  privateKey = good.privateKey;
  const jwk: JWK = { ...(await exportJWK(good.publicKey)), kid: KID, alg: "RS256", use: "sig" };
  keySet = createLocalJWKSet({ keys: [jwk] });

  const other = await generateKeyPair("RS256", { extractable: true });
  otherPrivateKey = other.privateKey;
});

const now = () => Math.floor(Date.now() / 1000);

async function sign(
  claims: Record<string, unknown>,
  opts: {
    key?: KeyLike;
    kid?: string;
    iss?: string | null;
    aud?: string;
    exp?: number;
    nbf?: number;
  } = {},
): Promise<string> {
  let builder = new SignJWT(claims).setProtectedHeader({
    alg: "RS256",
    kid: opts.kid ?? KID,
  });
  const iss = opts.iss === undefined ? ISSUER : opts.iss;
  if (iss) builder = builder.setIssuer(iss);
  if (opts.aud) builder = builder.setAudience(opts.aud);
  builder = builder.setIssuedAt(now());
  builder = builder.setExpirationTime(opts.exp ?? now() + 3600);
  if (opts.nbf !== undefined) builder = builder.setNotBefore(opts.nbf);
  return builder.sign(opts.key ?? privateKey);
}

async function grab<T>(p: Promise<T>): Promise<unknown> {
  return p.then(
    (v) => v,
    (e) => e,
  );
}

describe("verifyAccessToken", () => {
  it("accepts a valid token (scope as array)", async () => {
    const token = await sign({ sub: "user-1", scope: ["user_access"] });
    const session = await verifyAccessToken(token, config, keySet);
    expect(session.accessToken).toBe(token);
    expect(session.scopes).toContain("user_access");
    expect(session.subject).toBe("user-1");
  });

  it("accepts a valid token (scope as space-delimited string)", async () => {
    const token = await sign({ sub: "u", scope: "app_access user_access" });
    const session = await verifyAccessToken(token, config, keySet);
    expect(session.scopes).toEqual(["app_access", "user_access"]);
  });

  it("rejects insufficient scope with 403-kind", async () => {
    const token = await sign({ sub: "u", scope: ["app_access"] });
    const err = await grab(verifyAccessToken(token, config, keySet));
    expect(err).toBeInstanceOf(TokenError);
    expect((err as TokenError).kind).toBe("insufficient_scope");
  });

  it("rejects an expired token", async () => {
    const token = await sign({ scope: ["user_access"] }, { exp: now() - 60 });
    const err = await grab(verifyAccessToken(token, config, keySet));
    expect((err as TokenError).kind).toBe("invalid_token");
    // failure detail is captured so it can be logged
    expect((err as TokenError).claim).toBe("exp");
    expect((err as TokenError).code).toBe("ERR_JWT_EXPIRED");
  });

  it("rejects a not-yet-valid token (nbf in the future)", async () => {
    const token = await sign({ scope: ["user_access"] }, { nbf: now() + 3600 });
    const err = await grab(verifyAccessToken(token, config, keySet));
    expect((err as TokenError).kind).toBe("invalid_token");
  });

  it("rejects a wrong issuer and captures the failing claim", async () => {
    const token = await sign({ scope: ["user_access"] }, { iss: "https://evil.test" });
    const err = await grab(verifyAccessToken(token, config, keySet));
    expect((err as TokenError).kind).toBe("invalid_token");
    expect((err as TokenError).claim).toBe("iss");
  });

  it("rejects a bad signature (key not in JWKS)", async () => {
    const token = await sign({ scope: ["user_access"] }, { key: otherPrivateKey });
    const err = await grab(verifyAccessToken(token, config, keySet));
    expect((err as TokenError).kind).toBe("invalid_token");
  });

  it("rejects a malformed token", async () => {
    const err = await grab(verifyAccessToken("not.a.jwt", config, keySet));
    expect((err as TokenError).kind).toBe("invalid_token");
  });

  it("enforces audience only when configured", async () => {
    const withAud: AuthConfig = { ...config, audience: AUDIENCE };
    const wrong = await sign({ scope: ["user_access"] }, { aud: "some-client-id" });
    const errWrong = await grab(verifyAccessToken(wrong, withAud, keySet));
    expect((errWrong as TokenError).kind).toBe("invalid_token");

    const right = await sign({ scope: ["user_access"] }, { aud: AUDIENCE });
    const session = await verifyAccessToken(right, withAud, keySet);
    expect(session.accessToken).toBe(right);

    // audience OFF (default): a client-id aud is accepted (mirrors production today)
    const session2 = await verifyAccessToken(wrong, config, keySet);
    expect(session2.accessToken).toBe(wrong);
  });
});

describe("createAuthenticator", () => {
  const auth = () => createAuthenticator(config, keySet);
  const headers = (authorization?: string) => ({
    host: "mcp.test",
    ...(authorization ? { authorization } : {}),
  });

  it("returns 401 with resource_metadata for a missing token", async () => {
    const err = (await grab(auth()({ headers: headers() }))) as Response;
    expect(err).toBeInstanceOf(Response);
    expect(err.status).toBe(401);
    const wwwAuth = err.headers.get("WWW-Authenticate") ?? "";
    expect(wwwAuth).toContain(
      'resource_metadata="https://mcp.test/.well-known/oauth-protected-resource"',
    );
    expect(wwwAuth).not.toContain("error=");
  });

  it("returns 401 invalid_token for a bad token", async () => {
    const token = await sign({ scope: ["user_access"] }, { key: otherPrivateKey });
    const err = (await grab(auth()({ headers: headers(`Bearer ${token}`) }))) as Response;
    expect(err.status).toBe(401);
    expect(err.headers.get("WWW-Authenticate")).toContain('error="invalid_token"');
  });

  it("returns 403 insufficient_scope for a valid token missing the scope", async () => {
    const token = await sign({ scope: ["app_access"] });
    const err = (await grab(auth()({ headers: headers(`Bearer ${token}`) }))) as Response;
    expect(err.status).toBe(403);
    const wwwAuth = err.headers.get("WWW-Authenticate") ?? "";
    expect(wwwAuth).toContain('error="insufficient_scope"');
    expect(wwwAuth).toContain('scope="user_access"');
  });

  it("resolves to a session for a valid token", async () => {
    const token = await sign({ sub: "u", scope: ["user_access"] });
    const session = await auth()({ headers: headers(`Bearer ${token}`) });
    expect(session.accessToken).toBe(token);
  });

  describe("readonly query parameter", () => {
    const sessionFor = async (url?: string) => {
      const token = await sign({ sub: "u", scope: ["user_access"] });
      return auth()({ headers: headers(`Bearer ${token}`), url });
    };

    it.each([
      ["/mcp?readonly=true", true],
      ["/mcp?readonly=1", true],
      ["/mcp?readonly", true],
      ["/mcp?readonly=false", false],
      ["/mcp?readonly=0", false],
      ["/mcp?foo=bar", false],
      ["/mcp", false],
      [undefined, false],
    ])("url %s -> readonly=%s", async (url, expected) => {
      const session = await sessionFor(url as string | undefined);
      expect(session.readonly).toBe(expected);
    });
  });

  it("logs the specific failure (iss mismatch) and never logs the token", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // valid signature, but the issuer does not match config.issuer
    const token = await sign(
      { sub: "u", scope: ["user_access"] },
      { iss: "https://real.test:443" },
    );
    const res = (await grab(auth()({ headers: headers(`Bearer ${token}`) }))) as Response;
    expect(res.status).toBe(401);

    const logged = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toContain("invalid_token");
    expect(logged).toContain("claim=iss");
    expect(logged).toContain('expected_iss="https://issuer.test"');
    expect(logged).toContain('presented_iss="https://real.test:443"');
    expect(logged).not.toContain(token); // token is never logged
    warn.mockRestore();
  });
});
