import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_tables",
    description:
      `List all available tables for a given catalog and schema in the Peaka project.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "List Tables",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.listTables(
          args.projectId,
          args.catalogId,
          args.schemaName
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
