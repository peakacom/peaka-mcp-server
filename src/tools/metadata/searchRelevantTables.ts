import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import { handleToolError } from "../../error";
import type { ToolRegister } from "../types";
import { compactRelevantTables } from "./relevantTables";

export const registerSearchRelevantTablesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_search_relevant_tables",
    description: `Find candidate tables for a data question when the project is too large for peaka_list_project_tables to list. Returns up to 10 candidates, one row each: table, catalogId, the first sentence of its description, its column count and up to 40 column names, plus index state and coverage. Candidates may be incomplete or irrelevant: inspect them, then use peaka_list_columns for a candidate's full columns. If the index is unavailable, stale or has no useful matches, discover scope with peaka_list_catalogs, peaka_list_schemas and peaka_list_tables. Empty results do not mean the project has no data. Permission errors must be resolved, not bypassed with another tool. This tool does not execute SQL or refresh an index.

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
        return { content: [{ type: "text", text: JSON.stringify(compactRelevantTables(result)) }] };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_search_relevant_tables" });
      }
    },
  });
};
