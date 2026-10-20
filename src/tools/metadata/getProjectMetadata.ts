import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, filterMetadataResponse } from "../shared";
import type { ToolRegister } from "../types";
import { UserError } from "fastmcp";
import { handleToolError } from "../../error";
import { METADATA_FORMATS } from "../../types";

export const registerGetProjectMetadataTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_project_metadata",
    description:
      `Get metadata for all catalogs, schemas, and tables in the Peaka project in a single call. Optionally filter by catalogId and/or schemaName. Use this tool to discover the data structure before writing queries.

    format makes the result much smaller: "compact" returns { tables: [{ table, desc, columns: [{ name, type, desc, pk, values }], relations }] } with the table names as written in SQL; "ddl" returns CREATE TABLE statements with descriptions as comments. Without format the full stored metadata is returned. includeSamples (with a format) adds distinct sample values to each column.

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
      format: z
        .enum(METADATA_FORMATS)
        .optional()
        .describe('Optional smaller result: "compact" (JSON) or "ddl" (CREATE TABLE text). Omit for the full stored metadata.'),
      includeSamples: z
        .boolean()
        .optional()
        .describe("With format: add distinct sample values of each column."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        if (args.includeSamples && !args.format) {
          throw new UserError('includeSamples needs format "compact" or "ddl".');
        }
        if (args.format) {
          const text = await svc.getProjectMetadataAs(args.projectId, args.format, {
            catalogId: args.catalogId,
            schemaName: args.schemaName,
            includeSamples: args.includeSamples,
          });
          return { content: [{ type: "text", text }] };
        }
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
