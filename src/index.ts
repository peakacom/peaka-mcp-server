#!/usr/bin/env node
import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { APIService } from "./api.service";
import { PEAKA_SQL_RULE_SET } from "./constants";
import { DataService } from "./data.service";

const server = new FastMCP({
  name: "Peaka MCP Server",
  version: "1.0.0",
});

const apiService = APIService.Instance;
const dataService = DataService.Instance;

server.addTool({
  name: "peaka_query_golden_sqls",
  description: "Query question/sql pairs from Peaka's golden sql vector store.",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      const query = args.query;
      const result = await apiService.queryForGoldenSqls(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error("Error querying golden sqls", JSON.stringify(error));
      throw new UserError("Error querying golden sqls. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_execute_sql_query",
  description: "Runs the given sql query on Peaka.",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async (args, { log, reportProgress }) => {
    try {
      const query = args.query;
      reportProgress({
        progress: 0,
        total: 100,
      });
      const result = await dataService.executeSQLQuery(query);
      reportProgress({
        progress: 100,
        total: 100,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(
        `Error executing sql query ${args.query}`,
        JSON.stringify(error)
      );
      throw new UserError(
        "Error executing sql query. Check your sql query syntax."
      );
    }
  },
});

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

server.start({
  transportType: "stdio",
});
