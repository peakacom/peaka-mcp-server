import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListQueriesTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_queries",
    description:
      `List all saved queries in the Peaka project. Returns query names, SQL content, and whether they are plain or materialized.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.listQueries(args.projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
