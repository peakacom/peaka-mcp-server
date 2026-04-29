import { UserError } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerExecuteSqlQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_execute_sql_query",
    description:
      `Runs the given sql query on Peaka.

    BEFORE RUNNING THIS TOOL:
      1: Use peaka_get_project_metadata to determine which tables should be used in the query and their schemas.
      2: Use peaka_list_tables to determine if the tables of interest are cached or not (this response has isCached property)
      3: If one or more tables that you need to query are cacheable but not cached:
        3a: Warn the user that the results will be limited and ask if you should start the caching process for those tables, and start the caching process using the create cache tool
        3b: If the caching is rejected by the user, warn them that the query results will be limited and use LIMIT statements on the query to make sure it doesn't run forever

    ${PROJECT_ID_HINT}`,
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
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          log.error(error.message);
        }
        throw new UserError(
          "Error executing sql query. Check your sql query syntax."
        );
      }
    },
  });
};
