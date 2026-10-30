import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, cacheScheduleSchema, requireWrite } from "../shared";
import type { ToolRegister } from "../types";
import type { CreateCacheRequest } from "../../types";
import { handleToolError } from "../../error";

export const registerCreateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_cache",
    description:
      `Create a cache for a table in the Peaka project, so its records are read from Peaka instead of the source. Only for tables of a SaaS source that are not cached yet (peaka_list_project_tables: a SaaS schema's table without [cached]; peaka_list_tables: not_cached): a live read of them may return only the first page of records. A database table (e.g. Oracle) is read live and in full and is not cached. Create a cache only when the user asks for it or agrees to it, never to work around a failing or slow query; the first sync takes time, and until it completes the cache is not complete. Schedule expressions are optional at creation time and use ISO-8601 durations (e.g. PT6H, P1D, P7D, P30D); they can be set later with peaka_update_cache.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Create Cache",
      openWorldHint: false,
      readOnlyHint: false,
      destructiveHint: false,
    },
    canAccess: requireWrite,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
      incrementalSchedule: cacheScheduleSchema().optional().describe(
        "Optional incremental refresh schedule. {type: 'BASIC', expression: 'PT6H'} for recurring, or {type: 'NONE'} to leave it off. Omit to leave unset."
      ),
      fullRefreshSchedule: cacheScheduleSchema().optional().describe(
        "Optional full refresh schedule. {type: 'BASIC', expression: 'P7D'} for recurring, or {type: 'NONE'} to leave it off. Omit to leave unset."
      ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const body: CreateCacheRequest = {
          catalogId: args.catalogId,
          schemaName: args.schemaName,
          tableName: args.tableName,
        };
        if (args.incrementalSchedule) {
          body.incrementalCacheSchedule = args.incrementalSchedule;
        }
        if (args.fullRefreshSchedule) {
          body.fullRefreshCacheSchedule = args.fullRefreshSchedule;
        }

        const svc = resolveService(session);
        const result = await svc.createCache(args.projectId, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_create_cache" });
      }
    },
  });
};
