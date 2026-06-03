import { UserError } from "fastmcp";
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
  const apiKey = process.env.PEAKA_API_KEY;
  if (!apiKey) {
    throw new UserError(
      "PEAKA_API_KEY is not set. Set the PEAKA_API_KEY environment variable to authenticate with Peaka in stdio mode."
    );
  }
  return new APIService({
    accessToken: apiKey,
    baseUrl: process.env.PARTNER_API_BASE_URL,
  });
}
