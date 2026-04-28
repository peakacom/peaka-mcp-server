import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerListTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_tables",
    description:
      `List all available tables for a given catalog and schema in the Peaka project.

    ${PROJECT_ID_HINT}`,
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
        if (error instanceof UserError) throw error;
        log.error("Error listing tables", JSON.stringify(error));
      }
    },
  });
};
