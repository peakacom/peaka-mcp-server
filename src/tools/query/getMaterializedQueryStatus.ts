import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerMaterializedQueryStatusTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_materialized_query_statuses",
    description:
      `Inspect the auto-refresh state of materialized saved queries in the Peaka project. Returns each query's last refresh status, last/next scheduled execution times, and its schedule settings (interval/cron). Pass a queryId to inspect a single materialized query; omit it to list all of them.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Materialized Query Statuses",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      queryId: z
        .string()
        .optional()
        .describe(
          "Optional materialized query ID to inspect a single query. Available from peaka_list_queries (queryType: MATERIALIZED). Omit to list all materialized queries."
        ),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = args.queryId
          ? await svc.getMaterializedQueryStatus(args.projectId, args.queryId)
          : await svc.getMaterializedQueryStatuses(args.projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
