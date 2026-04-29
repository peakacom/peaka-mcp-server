import { UserError } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerListConnectionsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_connections",
    description:
      `List all data source connections in the Peaka project. Returns each connection's id, name, type, and (for OAuth-based connections) callback URL. Useful for discovering what data sources are wired up; pair with peaka_get_connection_detail for connection-specific configuration.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.listConnections(args.projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          log.error(error.message);
        }
      }
    },
  });
};
