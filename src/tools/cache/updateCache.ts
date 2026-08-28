import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, CACHE_SCHEDULE_SCHEMA } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerUpdateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_update_cache",
    description:
      `Update cache settings on an existing cache in the Peaka project. This endpoint replaces — not merges — the schedules, so both incrementalSchedule and fullRefreshSchedule must be supplied with the full intended state every call. Each schedule is either {type: "BASIC", expression} with an ISO-8601 duration (e.g. PT6H, P1D, P7D, P30D), or {type: "NONE"} to turn that refresh off. The response reflects the schedule actually applied, which the backend may clamp to its allowed range — check it.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Update Cache",
      openWorldHint: false,
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
      incrementalSchedule: CACHE_SCHEDULE_SCHEMA.describe(
        "Incremental refresh schedule. Required — replaces the existing value. {type: 'BASIC', expression: 'PT6H'} for recurring, or {type: 'NONE'} to disable."
      ),
      fullRefreshSchedule: CACHE_SCHEDULE_SCHEMA.describe(
        "Full refresh schedule. Required — replaces the existing value. {type: 'BASIC', expression: 'P7D'} for recurring, or {type: 'NONE'} to disable."
      ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.updateCache(args.projectId, args.cacheId, {
          incrementalCacheSchedule: args.incrementalSchedule,
          fullRefreshCacheSchedule: args.fullRefreshSchedule,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
