import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";
import { compactQueryResult } from "./queryResult";

export const registerExecuteSqlQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_execute_sql_query",
    description:
      `Runs the given sql query on Peaka.

    BEFORE RUNNING THIS TOOL:
      1: Find the tables with peaka_list_project_tables (one line a table, with its cache state), then read the chosen tables' columns with peaka_get_project_metadata and tables=[...] in one call. If the project is too large to list, list one schema or use peaka_search_relevant_tables.
      2: Check the tables' cache state in that list ([cached], [not cached], or no tag for sources always read live); peaka_list_tables gives it per schema too
      3: If one or more tables that you need to query are cacheable but not cached:
        3a: Warn the user that the results will be limited and, if caching tools are available in this session, offer to start caching those tables before querying
        3b: If the caching is rejected by the user, warn them that the query results will be limited and use LIMIT statements on the query to make sure it doesn't run forever

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Execute Sql Query",
      readOnlyHint: true,
      openWorldHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      query: z.string(),
    }),
    execute: async (args, { log, reportProgress, session }) => {
      try {
        const svc = resolveService(session);
        reportProgress({
          progress: 0,
          total: 100,
        });

        const transpiledQuery = await svc.transpileQueryToTrinoDialect(
          args.query
        );

        reportProgress({
          progress: 50,
          total: 100,
        });

        const result = await svc.executeSQLStatement(
          args.projectId,
          transpiledQuery.query
        );

        reportProgress({
          progress: 100,
          total: 100,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(compactQueryResult(result)) }],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_execute_sql_query" });
      }
    },
  });
};
