import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerGetCacheStatusesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_cache_statuses",
    description:
      `Get all cache statuses for tables in the Peaka project. Returns the current caching state, execution history, and progress for each cached table.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Cache Statuses",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getCacheStatuses(args.projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
