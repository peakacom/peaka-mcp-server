import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import { handleToolError } from "../../error";
import type { ToolRegister } from "../types";
import type { ProjectTableList } from "../../types";

/**
 * The list as the model reads it: a header with the count and the legend, then the search service's lines as they
 * are. A scope too large to list comes back as its schemas, one line each, and what to do next.
 */
export const projectTableListText = (result: ProjectTableList): string =>
  result.status === "listed"
    ? `${result.tables} tables. ${result.legend}\n\n${result.list}`
    : [
        `Too large to list whole (${result.tables} tables, ${result.reason === "too_many_tables" ? "over 400" : "over the size budget"}). ${result.nextAction}`,
        "Schemas (catalog.schema, catalogId, tables):",
        ...result.schemas.map((schema) => `${schema.catalog}.${schema.schema}, ${schema.catalogId}, ${schema.tables}`),
      ].join("\n");

export const registerListProjectTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_project_tables",
    description: `Start here to find the tables for a data question. Lists every table of the project (or of one catalog or schema) in one line each: catalog.schema.table, its cache state, the first sentence of its description, up to 12 column names and the tables it joins. Choose the tables the question needs from this list, then read their columns with peaka_get_project_metadata and tables=[...] in one call.

If the project is too large to list whole, the answer gives its schemas with their table counts: list one schema with catalogId and schemaName, or use peaka_search_relevant_tables.

${PROJECT_ID_HINT}`,
    annotations: { title: "List Project Tables", readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    parameters: z.object({
      projectId: z.string().min(1).describe("The Peaka project ID."),
      catalogId: z.string().optional().describe("Only this catalog's tables."),
      schemaName: z.string().optional().describe("Only this schema's tables (needs catalogId)."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const result = await resolveService(session).listProjectTables(args.projectId, {
          catalogId: args.catalogId,
          schemaName: args.schemaName,
        });
        return { content: [{ type: "text", text: projectTableListText(result) }] };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_list_project_tables" });
      }
    },
  });
};
