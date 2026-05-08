import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerRefreshCacheFullTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_refresh_cache_full",
    description:
      `Trigger a full refresh on an existing cache in the Peaka project. Use the cacheId returned from peaka_get_cache_statuses.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Refresh Cache Full",
      readOnlyHint: false,
      destructiveHint: false,
    },
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
        const result = await svc.refreshCacheFull(args.projectId, args.cacheId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
