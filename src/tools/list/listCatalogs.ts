import { UserError } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerListCatalogsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_catalogs",
    description:
      `List all available catalogs in the Peaka project. Returns catalog names, types, and connection info.

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
        const result = await svc.listCatalogs(args.projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          log.error(error.message);
        }
      }
    },
  });
};
