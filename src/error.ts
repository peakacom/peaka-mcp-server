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
    const data = (error.response?.data ?? {}) as {
      code?: number;
      message?: string;
      reason?: string;
    };
    console.error(
      `[tool-error] ${where}type=http status=${status ?? "?"} ` +
        `request="${requestPath(error)}" ` +
        `message="${logSafe(data.message ?? error.message)}"` +
        (data.reason ? ` reason="${logSafe(data.reason)}"` : ""),
    );
    logger?.error(error.message);
    throw new UserError(
      JSON.stringify({
        code: data.code ?? status,
        message: data.message ?? error.message,
        ...(data.reason ? { reason: data.reason } : {}),
      }),
    );
  }

  const e = error instanceof Error ? error : new Error(String(error));
  console.error(`[tool-error] ${where}type=unexpected message="${logSafe(e.message)}"`);
  throw e;
}
