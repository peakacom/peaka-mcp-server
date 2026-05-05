import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerDeleteSemanticTableTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_delete_semantic_table",
    description:
      `Delete a semantic table from a semantic catalog in the Peaka project. Removes the table mapping only; the saved query that backs it is not affected.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .describe("The semantic catalog ID that owns the table."),
      tableId: z
        .string()
        .describe(
          "The semantic table ID to delete. Returned by peaka_create_semantic_table."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.deleteSemanticTable(
          args.projectId,
          args.catalogId,
          args.tableId
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
