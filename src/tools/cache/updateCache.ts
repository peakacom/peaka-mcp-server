import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import type { UpdateCacheRequest } from "../../types";

export const registerUpdateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_update_cache",
    description:
      `Update cache settings on an existing cache in the Peaka project. Adjusts the incremental and/or full-refresh schedule expressions. Schedule expressions use ISO-8601 durations (e.g. PT6H, P1D, P7D, P30D). At least one of incrementalSchedule or fullRefreshSchedule must be provided.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      cacheId: z
        .string()
        .describe(
          "The cache ID to update. Available from peaka_get_cache_statuses."
        ),
      incrementalSchedule: z
        .string()
        .optional()
        .describe(
          "ISO-8601 duration for the incremental refresh schedule, e.g. PT6H, P1D."
        ),
      fullRefreshSchedule: z
        .string()
        .optional()
        .describe(
          "ISO-8601 duration for the full refresh schedule, e.g. P7D, P30D."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        if (!args.incrementalSchedule && !args.fullRefreshSchedule) {
          throw new UserError(
            "Provide at least one of incrementalSchedule or fullRefreshSchedule."
          );
        }

        const body: UpdateCacheRequest = {};
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
        const result = await svc.updateCache(args.projectId, args.cacheId, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error updating cache", JSON.stringify(error));
      }
    },
  });
};
