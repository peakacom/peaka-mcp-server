import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListConnectionsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_connections",
    description:
      `List all data source connections in the Peaka project. Returns each connection's id, name, type, and (for OAuth-based connections) callback URL. Useful for discovering what data sources are wired up; pair with peaka_get_connection_detail for connection-specific configuration.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "List Connections",
      readOnlyHint: true,
    },
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
        handleToolError(error, log);
      }
    },
  });
};
