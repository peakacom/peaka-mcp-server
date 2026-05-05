#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import "dotenv/config";
import { PEAKA_SQL_RULE_SET, PEAKA_ARTIFACT_TEMPLATE, DEFAULT_PORT } from "./constants";
import type { PeakaSession } from "./types";
import { getMode } from "./context";
import {
  registerQueryTools,
  registerMetadataTools,
  registerCacheTools,
  registerListTools,
  registerTableTools,
  registerConnectionTools,
  registerSemanticTools,
} from "./tools";

const mode = getMode();

const server = new FastMCP<PeakaSession>({
  name: "Peaka",
  version: "1.0.0",
  ...(mode === "httpStream" && {
    authenticate: async (request) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        const authServerUrl = process.env.OAUTH_AUTHORIZATION_SERVER_URL;
        if (!authServerUrl) {
          throw new Error("No OAUTH_AUTHORIZATION_SERVER_URL in the env");
        }
        const resourceMetadataUrl = new URL(authServerUrl);
        resourceMetadataUrl.pathname = ".well-known/oauth-authorization-server";
        const wwwAuth = authServerUrl
          ? `Bearer resource_metadata="${resourceMetadataUrl.toString()}"`
          : `Bearer`;
        throw new Response(
          JSON.stringify({
            error: "unauthorized",
            error_description: "Missing Bearer token",
          }),
          {
            status: 401,
            statusText: "Unauthorized",
            headers: {
              "WWW-Authenticate": wwwAuth,
              "Content-Type": "application/json",
            },
          },
        );
      }
      const token = authHeader.slice(7);
      return { accessToken: token };
    },
    health: {
      enabled: true,
    }
  }),
});

registerQueryTools(server);
registerMetadataTools(server);
registerCacheTools(server);
registerListTools(server);
registerTableTools(server);
registerConnectionTools(server);
registerSemanticTools(server);

server.addResource({
  uri: "file:///peaka_sql_query_rule_set.txt",
  name: "peaka_sql_query_rule_set",
  description:
    "Peaka SQL Query Rule Set is guidelines for writing sql queries for Peaka.",
  mimeType: "text/plain",
  async load() {
    return {
      text: PEAKA_SQL_RULE_SET,
    };
  },
});

server.addResource({
  uri: "file:///peaka_artifact_template.txt",
  name: "peaka_artifact_template",
  description:
    "Style guide and HTML template for generating visual reports, dashboards, and artifacts from Peaka query results.",
  mimeType: "text/plain",
  async load() {
    return {
      text: PEAKA_ARTIFACT_TEMPLATE,
    };
  },
});

if (mode === "httpStream") {
  server.start({
    transportType: "httpStream",
    httpStream: {
      port: Number(process.env.PORT) || DEFAULT_PORT,
      stateless: true,
      host: "0.0.0.0",
    },
  });
} else {
  server.start({ transportType: "stdio" });
}
