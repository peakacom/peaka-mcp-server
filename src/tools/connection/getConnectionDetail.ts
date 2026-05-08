import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerGetConnectionDetailTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_connection_detail",
    description:
      `Get connection-specific configuration detail for a data source connection in the Peaka project. The response shape varies by connection type — only the \`type\` field is guaranteed; remaining fields are connection-specific. Use peaka_list_connections to discover the connectionId.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Connection Detail",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      connectionId: z
        .string()
        .describe(
          "The connection ID to inspect. Available from peaka_list_connections."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getConnectionDetail(
          args.projectId,
          args.connectionId
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
