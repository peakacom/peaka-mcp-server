import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, filterMetadataResponse } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerGetProjectMetadataTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_project_metadata",
    description:
      `Get project metadata, preferably scoped by catalogId and/or schemaName. For metadata management, prefer peaka_list_table_metadata for one bounded page. For a data question, start with peaka_search_relevant_tables and fetch the scope you need. An unfiltered call can return a large response. If metadata is missing, use peaka_list_schemas, peaka_list_tables and peaka_list_columns; missing metadata does not mean no data.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Project Metadata",
      openWorldHint: false,
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .optional()
        .describe("Optional catalog ID to filter metadata by a specific catalog."),
      schemaName: z
        .string()
        .optional()
        .describe("Optional schema name to filter metadata by a specific schema."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getProjectMetadata(
          args.projectId,
          args.catalogId,
          args.schemaName
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(filterMetadataResponse(result), null, 2),
            },
          ],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_get_project_metadata" });
      }
    },
  });
};
