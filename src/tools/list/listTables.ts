import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT, CATALOG_REF } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";
import { compactTableList } from "./tableList";

export const registerListTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_tables",
    description:
      `List the tables of a catalog schema in the Peaka project: the catalog and schema once, then one row per table with its name and cache state.

    cache: "cached" = the table is read from Peaka's cache; "not_cached" = it can be cached but is read live from the source (a live read of a SaaS source may return only its first page of records); "not_cacheable" = always read live from the source (e.g. a database).
    Use tableNameContains to look up specific tables in a large schema; totalTables is the schema's size before that filter. Descriptions are left out unless includeDescriptions is true.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "List Tables",
      openWorldHint: false,
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string().describe(CATALOG_REF),
      schemaName: z.string(),
      tableNameContains: z
        .string()
        .optional()
        .describe("Only tables whose name contains this text, ignoring case."),
      includeDescriptions: z
        .boolean()
        .optional()
        .describe("Add each table's description as plain text. Large schemas get a much larger response."),
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
          content: [
            {
              type: "text",
              text: JSON.stringify(
                compactTableList(result, {
                  nameContains: args.tableNameContains,
                  includeDescriptions: args.includeDescriptions,
                })
              ),
            },
          ],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_list_tables" });
      }
    },
  });
};
