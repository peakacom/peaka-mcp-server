import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerDeleteCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_delete_cache",
    description:
      `Delete an existing cache in the Peaka project. Removes the cache entirely; the underlying table is not affected. Use the cacheId returned from peaka_get_cache_statuses.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      cacheId: z
        .string()
        .describe(
          "The cache ID to delete. Available from peaka_get_cache_statuses."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.deleteCache(args.projectId, args.cacheId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
