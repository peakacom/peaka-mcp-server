import { UserError } from "fastmcp";
import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerRefreshProjectMetadataTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_refresh_project_metadata",
    description:
      `Refresh project metadata for a specific catalog. This is a long-running operation that should only be used when a data source has structurally changed (e.g. new tables or columns added). Triggers the refresh and polls for completion, returning the final status.

    ${PROJECT_ID_HINT}`,
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .describe("The catalog ID to refresh metadata for."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.refreshProjectMetadata(
          args.projectId,
          args.catalogId
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        if (error instanceof UserError) throw error;
        log.error("Error refreshing project metadata", JSON.stringify(error));
      }
    },
  });
};
