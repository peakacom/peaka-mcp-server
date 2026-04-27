import { APIService } from "./api.service";
import type { PeakaSession } from "./types";

export function getMode(): "stdio" | "httpStream" {
  return process.env.TRANSPORT === "httpStream" ? "httpStream" : "stdio";
}

export function resolveService(session: PeakaSession | undefined): APIService {
  if (getMode() === "httpStream") {
    if (!session) throw new Error("Authentication required");
    return new APIService({
      accessToken: session.accessToken,
      baseUrl: process.env.PARTNER_API_BASE_URL,
    });
  }
  return new APIService({
    accessToken: process.env.PEAKA_API_KEY || "",
    baseUrl: process.env.PARTNER_API_BASE_URL,
  });
}
