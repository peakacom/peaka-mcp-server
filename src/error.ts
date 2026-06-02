import axios from "axios";
import { Context, UserError } from "fastmcp";
import { PeakaSession } from "./types";

type Logger = Context<PeakaSession>["log"];

export function handleToolError(error: unknown, logger?: Logger): void {
  if (error instanceof UserError) {
    throw error;
  }
  if (axios.isAxiosError(error)) {
    logger?.error(error.message);
    const data = (error.response?.data ?? {}) as {
      code?: number;
      message?: string;
      reason?: string;
    };
    const payload = {
      code: data.code ?? error.response?.status,
      message: data.message ?? error.message,
      ...(data.reason ? { reason: data.reason } : {}),
    };
    throw new UserError(JSON.stringify(payload));
  }
  throw error instanceof Error ? error : new Error(String(error));
}
