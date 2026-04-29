import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerUpdateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_update_cache",
    description:
      `Update cache settings on an existing cache in the Peaka project. This endpoint replaces — not merges — the schedules, so both incrementalSchedule and fullRefreshSchedule must be supplied with the full intended state every call. Schedule expressions use ISO-8601 durations (e.g. PT6H, P1D, P7D, P30D).

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      cacheId: z
        .string()
        .describe(
          "The cache ID to update. Available from peaka_get_cache_statuses."
        ),
      incrementalSchedule: z
        .string()
        .describe(
          "ISO-8601 duration for the incremental refresh schedule, e.g. PT6H, P1D. Required — replaces the existing value."
        ),
      fullRefreshSchedule: z
        .string()
        .describe(
          "ISO-8601 duration for the full refresh schedule, e.g. P7D, P30D. Required — replaces the existing value."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.updateCache(args.projectId, args.cacheId, {
          incrementalCacheSchedule: {
            type: "BASIC",
            expression: args.incrementalSchedule,
          },
          fullRefreshCacheSchedule: {
            type: "BASIC",
            expression: args.fullRefreshSchedule,
          },
        });
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
