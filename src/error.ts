import axios, { type AxiosError } from "axios";
import { Context, UserError } from "fastmcp";
import { PeakaSession } from "./types";

type Logger = Context<PeakaSession>["log"];

/** Bounded, single-line, newline-free — safe to embed in a log line. */
function logSafe(value: unknown): string {
  return String(value ?? "").replace(/[\r\n\t]/g, " ").slice(0, 512);
}

/**
 * Method + path of the failed request. Drops the query string (it can carry
 * search terms / SQL) and never touches headers (which carry the bearer token).
 */
function requestPath(error: AxiosError): string {
  const method = error.config?.method?.toUpperCase() ?? "";
  const path = (error.config?.url ?? "").split("?")[0];
  return logSafe(`${method} ${path}`.trim());
}

/**
 * Error body returned by the Partner API. Current gateways send RFC 9457
 * Problem Details (`application/problem+json`); older ones send
 * `{errorCode | code, message, reason}`. Both are read so errors stay
 * readable while gateways are rolled out.
 */
interface ApiErrorBody {
  // Problem Details
  title?: string;
  detail?: string;
  code?: string | number;
  traceId?: string;
  retryable?: boolean;
  params?: Record<string, unknown>;
  cause?: { code?: unknown; message?: unknown; location?: unknown };
  // Legacy
  errorCode?: string | number;
  message?: string;
  reason?: string;
}

/** Caps long upstream text (e.g. Trino's "Expecting: ..." lists) for the model. */
function bounded(value: unknown, max = 1000): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Normalizes a thrown tool error into the client-facing error AND writes a
 * server-side log line (`[tool-error]` on stderr) so failures are visible in
 * the server's own logs, not only returned to the caller. Pass `context.tool`
 * to include the tool name in the log. The bearer token and request headers
 * are never logged.
 */
export function handleToolError(
  error: unknown,
  logger?: Logger,
  context?: { tool?: string },
): void {
  const where = context?.tool ? `tool=${context.tool} ` : "";

  if (error instanceof UserError) {
    console.error(`[tool-error] ${where}type=user message="${logSafe(error.message)}"`);
    throw error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const raw = error.response?.data;
    // Non-JSON bodies (e.g. an HTML page from a proxy) carry nothing usable.
    const data: ApiErrorBody = raw && typeof raw === "object" ? raw : {};

    const code = data.code ?? data.errorCode ?? status;
    const message =
      bounded(data.detail) ??
      bounded(data.message) ??
      bounded(data.title) ??
      error.message;
    const cause =
      data.cause && typeof data.cause === "object"
        ? {
            ...(data.cause.code !== undefined ? { code: data.cause.code } : {}),
            ...(bounded(data.cause.message)
              ? { message: bounded(data.cause.message) }
              : {}),
            ...(data.cause.location !== undefined
              ? { location: data.cause.location }
              : {}),
          }
        : undefined;

    console.error(
      `[tool-error] ${where}type=http status=${status ?? "?"} ` +
        `code=${logSafe(code ?? "?")} ` +
        `request="${requestPath(error)}" ` +
        `message="${logSafe(message)}"` +
        (data.traceId ? ` traceId=${logSafe(data.traceId)}` : "") +
        (data.reason ? ` reason="${logSafe(data.reason)}"` : ""),
    );
    logger?.error(message);

    // Fields are picked explicitly: `debug` (stack traces, internal paths)
    // and `instance`/`type` are never forwarded to the client.
    throw new UserError(
      JSON.stringify({
        code,
        ...(status !== undefined ? { status } : {}),
        message,
        ...(typeof data.retryable === "boolean"
          ? { retryable: data.retryable }
          : {}),
        ...(data.params && typeof data.params === "object"
          ? { params: data.params }
          : {}),
        ...(cause && Object.keys(cause).length > 0 ? { cause } : {}),
        ...(data.reason ? { reason: data.reason } : {}),
      }),
    );
  }

  const e = error instanceof Error ? error : new Error(String(error));
  console.error(`[tool-error] ${where}type=unexpected message="${logSafe(e.message)}"`);
  throw e;
}
