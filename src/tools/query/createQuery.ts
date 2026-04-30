import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerCreateQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_query",
    description:
      `Create a named, saved query in the Peaka project's semantic layer. Returns the created query object including its ID, which can be passed to peaka_execute_query.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      displayName: z
        .string()
        .describe("Human-readable name for the saved query."),
      inputQuery: z.string().describe("The Trino SQL body of the query."),
      queryType: z
        .enum(["PLAIN", "MATERIALIZED"])
        .optional()
        .default("PLAIN")
        .describe(
          "PLAIN runs the SQL on each execute; MATERIALIZED stores results."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.createQuery(args.projectId, {
          displayName: args.displayName,
          inputQuery: args.inputQuery,
          queryType: args.queryType,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
