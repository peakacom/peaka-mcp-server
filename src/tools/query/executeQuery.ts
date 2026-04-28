import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerExecuteQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_execute_query",
    description:
      `Execute a saved query by its ID in the Peaka project. Use peaka_list_queries to find available query IDs.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.executeQuery(args.projectId, args.queryId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error executing query", JSON.stringify(error));
      }
    },
  });
};
