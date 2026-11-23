import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";
import { boundQueryResult, compactQueryResult } from "./queryResult";
import { RESPONSE_BUDGET_CHARS } from "../budget";
import axios from "axios";

/** A Trino syntax error, as the Partner API reports it (problem+json with cause.code SYNTAX_ERROR). */
export const isSyntaxError = (error: unknown): boolean =>
  axios.isAxiosError(error) && (error.response?.data as { cause?: { code?: unknown } } | undefined)?.cause?.code === "SYNTAX_ERROR";

export const registerExecuteSqlQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_execute_sql_query",
    description:
      `Runs the given SQL on Peaka. The SQL is Trino: catalog.schema.table names as listed; DATE '2025-01-31' and INTERVAL '30' DAY literals; integer division truncates (CAST to DOUBLE for ratios); NOT EXISTS instead of NOT IN when NULLs are possible; aggregate in SQL. A failing query returns Trino's message with its line and column: fix that part and run again. Full rules: the peaka_sql_query_rule_set resource.

    BEFORE RUNNING THIS TOOL:
      1: Find the tables with peaka_list_project_tables (one line a table, with its cache state), then read the chosen tables' columns with peaka_get_project_metadata and tables=[...] in one call. If the project is too large to list, list one schema or use peaka_search_relevant_tables.
      2: Check how the tables are read in that list: each schema's header says SaaS source or database, and a SaaS table marked [cached] is read from the cache; peaka_list_tables gives it per schema too
      3: A SaaS table not marked [cached] is read live, and a live read may return only its first page of records: say the result may be incomplete, and, if caching tools are available, offer to cache the table. Do not start a cache without the user's yes.
      The answer is { columns, rows, returnedRows, totalRows }; a large result is cut (truncated: true, with a note): aggregate or narrow in SQL instead of reading rows.
      4: A database table (e.g. Oracle) is always read live and in full: caching does not make its answer more complete. If a query on it fails or is slow, fix or narrow the SQL, or report the error; do not try to cache it.

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

        // The SQL runs as written: a Trino error then points at the model's own line and column. Only a syntax
        // error is tried once more through the dialect transpiler (another dialect's SQL, e.g. Postgres' ::), which
        // otherwise rewrites valid Trino (case, DATE literals, AS) and shifts every error position (DEV-4185).
        let ran: string | undefined;
        let result;
        try {
          result = await svc.executeSQLStatement(args.projectId, args.query);
        } catch (error) {
          if (!isSyntaxError(error)) throw error;
          const transpiled = await svc.transpileQueryToTrinoDialect(args.query).catch(() => undefined);
          if (!transpiled?.query || transpiled.query.trim() === args.query.trim()) throw error;
          reportProgress({ progress: 50, total: 100 });
          result = await svc.executeSQLStatement(args.projectId, transpiled.query);
          ran = transpiled.query;
        }

        reportProgress({
          progress: 100,
          total: 100,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              ...boundQueryResult(compactQueryResult(result), RESPONSE_BUDGET_CHARS),
              ...(ran ? { ranAs: ran, ranAsNote: "Your SQL was not valid Trino; Peaka rewrote it to Trino and ran it as ranAs." } : {}),
            }),
          }],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_execute_sql_query" });
      }
    },
  });
};
