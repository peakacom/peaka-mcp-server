import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerRefreshMaterializedQueryTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_refresh_materialized_query",
    description:
      `Trigger a refresh on a materialized saved query in the Peaka project. Use the queryId returned from peaka_list_queries for queries whose queryType is "MATERIALIZED".

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Refresh Materialized Query",
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z
        .string()
        .describe(
          "The materialized query ID to refresh. Available from peaka_list_queries (queryType: MATERIALIZED)."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.refreshMaterializedQuery(
          args.projectId,
          args.queryId
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
