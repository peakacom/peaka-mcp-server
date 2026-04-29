import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerGetRelationsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_relations",
    description:
      `Get table relationships (foreign keys) for a catalog in the Peaka project. Useful for understanding how tables connect when constructing JOINs — without this, JOIN conditions have to be guessed from column-name similarity. The response is an open-ended object map keyed by relation identifier.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .describe("The catalog ID whose relationships should be returned."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getRelations(args.projectId, args.catalogId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error getting relations", JSON.stringify(error));
      }
    },
  });
};
