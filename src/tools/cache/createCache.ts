import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import type { CreateCacheRequest } from "../../types";

export const registerCreateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_cache",
    description:
      `Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally. Schedule expressions are optional at creation time and use ISO-8601 durations (e.g. PT6H, P1D, P7D, P30D); they can be set later with peaka_update_cache.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
      incrementalSchedule: z
        .string()
        .optional()
        .describe(
          "Optional ISO-8601 duration for the incremental refresh schedule, e.g. PT6H, P1D."
        ),
      fullRefreshSchedule: z
        .string()
        .optional()
        .describe(
          "Optional ISO-8601 duration for the full refresh schedule, e.g. P7D, P30D."
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
          body.incrementalCacheSchedule = {
            type: "BASIC",
            expression: args.incrementalSchedule,
          };
        }
        if (args.fullRefreshSchedule) {
          body.fullRefreshCacheSchedule = {
            type: "BASIC",
            expression: args.fullRefreshSchedule,
          };
        }

        const svc = resolveService(session);
        const result = await svc.createCache(args.projectId, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error creating cache", JSON.stringify(error));
      }
    },
  });
};
