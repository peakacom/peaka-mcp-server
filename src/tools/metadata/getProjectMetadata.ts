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
      `Get project metadata. For a data question: choose the tables from peaka_list_project_tables, then pass them here as tables=["catalog.schema.table", ...] (up to 20) to get their columns, types, descriptions, keys and relations in one call; format defaults to "compact" then. Otherwise scope by catalogId and/or schemaName; an unscoped call can return a large response. For metadata management, prefer peaka_list_table_metadata for one bounded page. If metadata is missing, use peaka_list_schemas, peaka_list_tables and peaka_list_columns; missing metadata does not mean no data.

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
      tables: z
        .array(z.string().min(1))
        .max(20)
        .optional()
        .describe('Tables as catalog.schema.table, as peaka_list_project_tables writes them. Not with catalogId/schemaName.'),
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
        const tables = args.tables?.length ? args.tables : undefined;
        if (tables && (args.catalogId || args.schemaName)) {
          throw new UserError("Pass tables or a catalogId/schemaName scope, not both.");
        }
        // Named tables are for reading before a query: compact unless asked otherwise.
        const format = args.format ?? (tables ? "compact" : undefined);
        if (args.includeSamples && !format) {
          throw new UserError('includeSamples needs format "compact" or "ddl".');
        }
        if (format) {
          const text = await svc.getProjectMetadataAs(args.projectId, format, {
            catalogId: args.catalogId,
            schemaName: args.schemaName,
            includeSamples: args.includeSamples,
            tables,
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
              text: JSON.stringify(filterMetadataResponse(result)),
            },
          ],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_get_project_metadata" });
      }
    },
  });
};
