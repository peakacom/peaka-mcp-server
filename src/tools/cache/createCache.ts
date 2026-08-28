import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, CACHE_SCHEDULE_SCHEMA } from "../shared";
import type { ToolRegister } from "../types";
import type { CreateCacheRequest } from "../../types";
import { handleToolError } from "../../error";

export const registerCreateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_cache",
    description:
      `Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally. Schedule expressions are optional at creation time and use ISO-8601 durations (e.g. PT6H, P1D, P7D, P30D); they can be set later with peaka_update_cache.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Create Cache",
      openWorldHint: false,
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
      incrementalSchedule: CACHE_SCHEDULE_SCHEMA.optional().describe(
        "Optional incremental refresh schedule. {type: 'BASIC', expression: 'PT6H'} for recurring, or {type: 'NONE'} to leave it off. Omit to leave unset."
      ),
      fullRefreshSchedule: CACHE_SCHEDULE_SCHEMA.optional().describe(
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
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
