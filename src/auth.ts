import type { IncomingHttpHeaders } from "http";
import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { PeakaSession } from "./types";

export type TokenErrorKind = "invalid_token" | "insufficient_scope";

/**
 * Raised by {@link verifyAccessToken} when a token fails validation. `kind`
 * maps to the OAuth `WWW-Authenticate` error and the HTTP status the transport
 * should return (401 for `invalid_token`, 403 for `insufficient_scope`).
 */
export class TokenError extends Error {
  readonly kind: TokenErrorKind;
  readonly description: string;

  constructor(kind: TokenErrorKind, description: string) {
    super(description);
    this.name = "TokenError";
    this.kind = kind;
    this.description = description;
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
    throw new TokenError(
      "invalid_token",
      err instanceof Error ? err.message : "Token verification failed",
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

/**
 * Builds the fastmcp `authenticate` handler: rejects missing/invalid tokens
 * with a transport-level 401 and insufficient-scope with a 403, before any
 * tool or the Partner API is ever reached.
 */
export function createAuthenticator(config: AuthConfig, keySet: JWTVerifyGetKey) {
  return async (request: { headers: IncomingHttpHeaders }): Promise<PeakaSession> => {
    const resourceMetadata = resourceMetadataUrl(request.headers);
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
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
        if (err.kind === "insufficient_scope") {
          throw buildChallenge({
            status: 403,
            error: "insufficient_scope",
            description: err.description,
            resourceMetadata,
            scope: config.requiredScope,
          });
        }
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
