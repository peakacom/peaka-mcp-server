import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import { handleToolError } from "../../error";
import type { ToolRegister } from "../types";

export const registerSearchRelevantTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_search_relevant_tables",
    description: `Find candidate tables for a data question before fetching project-wide metadata. Returns up to 10 candidates with source-verified columns, current descriptions, index state and coverage. Candidates may be incomplete or irrelevant: inspect them, then use peaka_get_project_metadata with catalogId/schemaName or peaka_list_columns for the required scope. If the index is unavailable, stale or has no useful matches, discover scope with peaka_list_catalogs, peaka_list_schemas and peaka_list_tables. Empty results do not mean the project has no data. Permission errors must be resolved, not bypassed with another tool. This tool does not execute SQL or refresh an index.

${PROJECT_ID_HINT}`,
    annotations: { title: "Find Relevant Tables", readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    parameters: z.object({
      projectId: z.string().min(1).describe("The Peaka project ID."),
      question: z.string().trim().min(1).max(2000).describe("The data question or concepts to search for."),
      limit: z.number().int().min(1).max(10).default(5).describe("Maximum candidate tables to return."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const result = await resolveService(session).searchRelevantTables(args.projectId, args.question, args.limit);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_search_relevant_tables" });
      }
    },
  });
};
