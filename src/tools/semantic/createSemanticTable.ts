import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerCreateSemanticTableTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_semantic_table",
    description:
      `Create a semantic table inside a semantic catalog in the Peaka project. The table is backed by an existing saved query, so the catalog/schema/table identifiers become a queryable view over that query. Use peaka_create_query (or peaka_list_queries) to obtain the queryId, and peaka_create_semantic_catalog (or peaka_list_catalogs) for the catalogId.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .describe(
          "The semantic catalog ID the table should belong to. From peaka_create_semantic_catalog or peaka_list_catalogs."
        ),
      schemaName: z.string().describe("Name of the schema for the table."),
      tableName: z.string().describe("Name of the semantic table to create."),
      queryId: z
        .string()
        .describe(
          "The saved query ID used to populate the semantic table. From peaka_list_queries or peaka_create_query."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.createSemanticTable(
          args.projectId,
          args.catalogId,
          {
            schemaName: args.schemaName,
            tableName: args.tableName,
            queryId: args.queryId,
          }
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
