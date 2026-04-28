import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerRefreshCacheIncrementalTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_refresh_cache_incremental",
    description:
      `Trigger an incremental update on an existing cache in the Peaka project. Fetches only new/changed rows — much faster than a full refresh. Use the cacheId returned from peaka_get_cache_statuses.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      cacheId: z
        .string()
        .describe(
          "The cache ID to refresh. Available from peaka_get_cache_statuses."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.refreshCacheIncremental(
          args.projectId,
          args.cacheId
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error refreshing cache incrementally", JSON.stringify(error));
      }
    },
  });
};
