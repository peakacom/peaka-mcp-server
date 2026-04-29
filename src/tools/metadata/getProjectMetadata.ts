import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, filterMetadataResponse } from "../shared";
import type { ToolRegister } from "../types";

export const registerGetProjectMetadataTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_project_metadata",
    description:
      `Get metadata for all catalogs, schemas, and tables in the Peaka project in a single call. Optionally filter by catalogId and/or schemaName. Use this tool to discover the data structure before writing queries.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: true,
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
        if (error instanceof UserError) throw error;
        log.error("Error getting project metadata", JSON.stringify(error));
      }
    },
  });
};
