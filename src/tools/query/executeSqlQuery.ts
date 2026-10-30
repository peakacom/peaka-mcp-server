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
      1: Use peaka_search_relevant_tables to find candidate tables, then fetch only the needed metadata scope or columns. If search is unavailable or unhelpful, use catalog/schema/table discovery.
      2: Use peaka_list_tables to determine if the tables of interest are cached or not (this response has isCached property)
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
