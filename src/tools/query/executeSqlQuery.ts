import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";
import { boundQueryResult, compactQueryResult } from "./queryResult";
import { RESPONSE_BUDGET_CHARS } from "../budget";

export const registerExecuteSqlQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_execute_sql_query",
    description:
      `Runs the given sql query on Peaka.

    BEFORE RUNNING THIS TOOL:
      1: Find the tables with peaka_list_project_tables (one line a table, with its cache state), then read the chosen tables' columns with peaka_get_project_metadata and tables=[...] in one call. If the project is too large to list, list one schema or use peaka_search_relevant_tables.
      2: Check the tables' cache state in that list ([cached], [not cached], or no tag for sources always read live); peaka_list_tables gives it per schema too
      3: A [not cached] table is a SaaS source read live, and a live read may return only its first page of records: say the result may be incomplete, and, if caching tools are available, offer to cache the table. Do not start a cache without the user's yes.
      The answer is { columns, rows, returnedRows, totalRows }; a large result is cut (truncated: true, with a note): aggregate or narrow in SQL instead of reading rows.
      4: A table with no cache tag (e.g. Oracle or another database) is always read live and in full: caching does not make its answer more complete. If a query on it fails or is slow, fix or narrow the SQL, or report the error; do not try to cache it.

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
          content: [{ type: "text", text: JSON.stringify(boundQueryResult(compactQueryResult(result), RESPONSE_BUDGET_CHARS)) }],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_execute_sql_query" });
      }
    },
  });
};
