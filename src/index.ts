#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { createRemoteJWKSet } from "jose";
import "dotenv/config";
import { PEAKA_SQL_RULE_SET, PEAKA_ARTIFACT_TEMPLATE, DEFAULT_PORT, PEAKA_MCP_VERSION, PEAKA_SERVER_INSTRUCTIONS } from "./constants";
import type { PeakaSession } from "./types";
import { getMode } from "./context";
import { budgetedServer } from "./tools/budget";
import { loadAuthConfig, createAuthenticator } from "./auth";
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

const authenticate =
  mode === "httpStream"
    ? (() => {
        const config = loadAuthConfig();
        const jwks = createRemoteJWKSet(new URL(config.jwksUri));
        return createAuthenticator(config, jwks);
      })()
    : undefined;

const server = new FastMCP<PeakaSession>({
  name: "Peaka",
  version: PEAKA_MCP_VERSION,
  instructions: PEAKA_SERVER_INSTRUCTIONS,
  ...(mode === "httpStream" && {
    authenticate,
    health: {
      enabled: true,
    },
  }),
});

// Every tool answer within the response budget (DEV-4186).
const tools = budgetedServer(server);
registerQueryTools(tools);
registerMetadataTools(tools);
registerCacheTools(tools);
registerListTools(tools);
registerTableTools(tools);
registerConnectionTools(tools);
registerSemanticTools(tools);

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

const onStartError = (error: unknown) => {
  console.error("Failed to start Peaka MCP server: ", error);
  process.exit(1);
};

if (mode === "httpStream") {
  server
    .start({
      transportType: "httpStream",
      httpStream: {
        port: process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT,
        stateless: true,
        host: "0.0.0.0",
      },
    })
    .catch(onStartError);
} else {
  server.start({ transportType: "stdio" }).catch(onStartError);
}
