import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import type { UpdateQueryRequest } from "../../types";
import { handleToolError } from "../../error";

export const registerUpdateQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_update_query",
    description:
      `Update an existing saved query in the Peaka project. Adjusts the display name, SQL body, and/or the auto-refresh schedule (for materialized queries). At least one of displayName, inputQuery, or schedule must be provided.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Update Query",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z
        .string()
        .describe("The query ID to update. Available from peaka_list_queries."),
      displayName: z
        .string()
        .optional()
        .describe("New human-readable name for the saved query."),
      inputQuery: z
        .string()
        .optional()
        .describe("New Trino SQL body for the saved query."),
      schedule: z
        .string()
        .optional()
        .describe(
          "New auto-refresh interval for a MATERIALIZED query as an ISO-8601 duration, e.g. PT6H, P1D. Applies only to materialized queries."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        if (!args.displayName && !args.inputQuery && !args.schedule) {
          throw new UserError(
            "Provide at least one of displayName, inputQuery, or schedule."
          );
        }

        const body: UpdateQueryRequest = {};
        if (args.displayName) body.displayName = args.displayName;
        if (args.inputQuery) body.inputQuery = args.inputQuery;
        if (args.schedule) body.schedule = { expression: args.schedule };

        const svc = resolveService(session);
        const result = await svc.updateQuery(args.projectId, args.queryId, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
