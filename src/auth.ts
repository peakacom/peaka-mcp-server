import type { IncomingHttpHeaders } from "http";
import { jwtVerify, decodeJwt, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { PeakaSession } from "./types";

export type TokenErrorKind = "invalid_token" | "insufficient_scope";

/**
 * Raised by {@link verifyAccessToken} when a token fails validation. `kind`
 * maps to the OAuth `WWW-Authenticate` error and the HTTP status the transport
 * should return (401 for `invalid_token`, 403 for `insufficient_scope`).
 *
 * `code`/`claim` carry the underlying jose failure so the caller can log
 * precisely which check failed (e.g. code=ERR_JWT_CLAIM_VALIDATION_FAILED,
 * claim="iss"/"aud"; code=ERR_JWT_EXPIRED; code=ERR_JWS_SIGNATURE_VERIFICATION_FAILED).
 */
export class TokenError extends Error {
  readonly kind: TokenErrorKind;
  readonly description: string;
  readonly code?: string;
  readonly claim?: string;

  constructor(
    kind: TokenErrorKind,
    description: string,
    detail?: { code?: string; claim?: string },
  ) {
    super(description);
    this.name = "TokenError";
    this.kind = kind;
    this.description = description;
    this.code = detail?.code;
    this.claim = detail?.claim;
  }
}

export interface AuthConfig {
  issuer: string;
  jwksUri: string;
  requiredScope: string;
  /**
   * Expected audience (the MCP resource). Optional and OFF by default: the
   * Peaka OAuth server currently sets `aud` to the client_id rather than the
   * resource (see DEV-3849), so enabling this would reject every real token.
   * Set OAUTH_RESOURCE only once the authorization server binds `aud` to the
   * resource, then the confused-deputy check turns on automatically.
   */
  audience?: string;
}

/** Reads and validates the OAuth config from the environment. Fails fast. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const issuer = env.OAUTH_ISSUER;
  const jwksUri = env.OAUTH_JWKS_URI;
  if (!issuer) {
    throw new Error("OAUTH_ISSUER is not set in the environment");
  }
  if (!jwksUri) {
    throw new Error("OAUTH_JWKS_URI is not set in the environment");
  }
  return {
    issuer,
    jwksUri,
    requiredScope: env.OAUTH_REQUIRED_SCOPE || "user_access",
    audience: env.OAUTH_RESOURCE || undefined,
  };
}

/** Normalizes the scope claim, tolerating both a space-delimited `scope`
 * string and a `scope`/`scp` array (Peaka emits an array). */
function extractScopes(payload: JWTPayload): string[] {
  const raw =
    (payload as Record<string, unknown>).scope ??
    (payload as Record<string, unknown>).scp;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return raw.split(" ").filter(Boolean);
  return [];
}

/**
 * Verifies a bearer access token against the authorization server's JWKS.
 * Pure and side-effect free so it can be unit tested with an injected key set.
 * Throws {@link TokenError} on any failure; returns the session on success.
 */
export async function verifyAccessToken(
  token: string,
  config: AuthConfig,
  keySet: JWTVerifyGetKey,
): Promise<PeakaSession> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, keySet, {
      issuer: config.issuer,
      algorithms: ["RS256"],
      ...(config.audience ? { audience: config.audience } : {}),
    }));
  } catch (err) {
    const e = err as { code?: unknown; claim?: unknown; message?: unknown };
    throw new TokenError(
      "invalid_token",
      typeof e?.message === "string" ? e.message : "Token verification failed",
      {
        code: typeof e?.code === "string" ? e.code : undefined,
        claim: typeof e?.claim === "string" ? e.claim : undefined,
      },
    );
  }

  const scopes = extractScopes(payload);
  if (!scopes.includes(config.requiredScope)) {
    throw new TokenError(
      "insufficient_scope",
      `Token is missing required scope "${config.requiredScope}"`,
    );
  }

  return {
    accessToken: token,
    subject: typeof payload.sub === "string" ? payload.sub : undefined,
    scopes,
    claims: payload,
  };
}

/** Header values may be `string | string[]`; take the first, before any comma. */
function firstHeader(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.split(",")[0].trim();
}

/**
 * Builds the OAuth protected-resource metadata URL on the MCP server's own
 * origin, derived from the (proxy-)forwarded request host.
 */
export function resourceMetadataUrl(headers: IncomingHttpHeaders): string {
  const proto = firstHeader(headers["x-forwarded-proto"]);
  const host = firstHeader(headers["x-forwarded-host"]) ?? headers.host;
  if (!host) {
    throw new Error("Cannot determine request host for OAuth metadata");
  }
  return new URL(
    "/.well-known/oauth-protected-resource",
    `${proto ?? "https"}://${host}`,
  ).toString();
}

/** Strips characters that would break a quoted `WWW-Authenticate` value. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, " ").trim();
}

interface Challenge {
  status: number;
  error?: string;
  description: string;
  resourceMetadata: string;
  scope?: string;
}

/** Constructs the 401/403 `Response` carrying the `WWW-Authenticate` challenge. */
export function buildChallenge(c: Challenge): Response {
  const params: string[] = [];
  if (c.error) {
    params.push(`error="${c.error}"`);
    params.push(`error_description="${sanitize(c.description)}"`);
  }
  if (c.scope) params.push(`scope="${c.scope}"`);
  params.push(`resource_metadata="${c.resourceMetadata}"`);

  return new Response(
    JSON.stringify({
      error: c.error ?? "unauthorized",
      error_description: c.description,
    }),
    {
      status: c.status,
      statusText: c.status === 403 ? "Forbidden" : "Unauthorized",
      headers: {
        "WWW-Authenticate": `Bearer ${params.join(", ")}`,
        "Content-Type": "application/json",
      },
    },
  );
}

/** Makes a value safe to embed in a single log line: no control chars, bounded. */
function logSafe(value: unknown): string {
  return String(value ?? "").replace(/[\r\n\t]/g, " ").slice(0, 256);
}

/**
 * Decodes (WITHOUT verifying) only the identifier claims we log for diagnostics.
 * Never returns `sub`/`email`/`jti` or the token itself.
 */
function presentedIdentifiers(token: string): { iss: string; aud: string; scope: string } {
  try {
    const p = decodeJwt(token);
    return {
      iss: logSafe(p.iss),
      aud: logSafe(Array.isArray(p.aud) ? p.aud.join(",") : p.aud),
      scope: logSafe(extractScopes(p).join(" ")),
    };
  } catch {
    return { iss: "", aud: "", scope: "" };
  }
}

/**
 * Builds the fastmcp `authenticate` handler: rejects missing/invalid tokens
 * with a transport-level 401 and insufficient-scope with a 403, before any
 * tool or the Partner API is ever reached.
 *
 * Every rejection is logged (stderr, `[auth]`-prefixed) with the specific
 * failure — for `invalid_token`, the jose code/claim plus the expected vs
 * presented `iss`/`aud` so config mismatches (e.g. an issuer with/without an
 * explicit `:443` port) are obvious. The bearer token is never logged.
 */
export function createAuthenticator(config: AuthConfig, keySet: JWTVerifyGetKey) {
  return async (request: { headers: IncomingHttpHeaders }): Promise<PeakaSession> => {
    const resourceMetadata = resourceMetadataUrl(request.headers);
    const host = logSafe(
      firstHeader(request.headers["x-forwarded-host"]) ?? request.headers.host,
    );
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      // A missing token is expected traffic (discovery, unauthenticated scans),
      // not an auth failure worth logging; only presented-but-rejected tokens are.
      throw buildChallenge({
        status: 401,
        description: "Missing Bearer token",
        resourceMetadata,
      });
    }

    const token = authHeader.slice(7);
    try {
      return await verifyAccessToken(token, config, keySet);
    } catch (err) {
      if (err instanceof TokenError) {
        const presented = presentedIdentifiers(token);
        if (err.kind === "insufficient_scope") {
          console.warn(
            `[auth] 403 insufficient_scope required="${logSafe(config.requiredScope)}" ` +
              `presented_scope="${presented.scope}" host=${host}`,
          );
          throw buildChallenge({
            status: 403,
            error: "insufficient_scope",
            description: err.description,
            resourceMetadata,
            scope: config.requiredScope,
          });
        }
        console.warn(
          `[auth] 401 invalid_token code=${logSafe(err.code ?? "n/a")} ` +
            `claim=${logSafe(err.claim ?? "n/a")} reason="${logSafe(err.description)}" ` +
            `expected_iss="${logSafe(config.issuer)}" presented_iss="${presented.iss}" ` +
            `expected_aud="${logSafe(config.audience ?? "(unchecked)")}" presented_aud="${presented.aud}" ` +
            `host=${host}`,
        );
        throw buildChallenge({
          status: 401,
          error: "invalid_token",
          description: err.description,
          resourceMetadata,
        });
      }
      throw err;
    }
  };
}
