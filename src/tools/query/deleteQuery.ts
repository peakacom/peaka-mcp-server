import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerDeleteQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_delete_query",
    description:
      `Delete a saved query from the Peaka project. Use the queryId returned from peaka_list_queries.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z
        .string()
        .describe("The query ID to delete. Available from peaka_list_queries."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.deleteQuery(args.projectId, args.queryId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error deleting query", JSON.stringify(error));
      }
    },
  });
};
