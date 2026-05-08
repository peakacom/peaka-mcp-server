import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListColumnsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_columns",
    description:
      `List all columns for a given table in the Peaka project. Returns column names, data types, and constraints. Use peaka_get_project_metadata first to discover available catalogs, schemas, and tables.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "List Columns",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.listColumns(
          args.projectId,
          args.catalogId,
          args.schemaName,
          args.tableName
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
