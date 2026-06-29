import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerGetQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_query",
    description:
      `Read a single saved query by its ID. Returns the full query object including displayName, inputQuery (SQL), queryType, and the auto-refresh schedule for materialized queries.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Query",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z
        .string()
        .describe("The query ID to read. Available from peaka_list_queries."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getQuery(args.projectId, args.queryId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
