import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerCreateCacheTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_cache",
    description:
      `Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.createCache(
          args.projectId,
          args.catalogId,
          args.schemaName,
          args.tableName
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error creating cache", JSON.stringify(error));
      }
    },
  });
};
