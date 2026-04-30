import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListSchemasTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_schemas",
    description:
      `List all available schemas for a given catalog in the Peaka project.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.listSchemas(args.projectId, args.catalogId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
