import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerQueryGoldenSqlsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_query_golden_sqls",
    description:
      `Query question/sql pairs from Peaka's golden sql vector store.
    If you find an existing query matching the user's question, just use it.
    Otherwise use the other tools to figure out the tables and write the query.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Query Golden Sqls",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      query: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.queryForGoldenSqls(args.projectId, args.query);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
