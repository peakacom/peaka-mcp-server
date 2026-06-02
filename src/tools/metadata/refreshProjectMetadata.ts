import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerRefreshProjectMetadataTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_refresh_project_metadata",
    description:
      `Refresh project metadata for a specific catalog. This is a long-running operation that should only be used when a data source has structurally changed (e.g. new tables or columns added). Triggers the refresh asynchronously and returns immediately; it does not wait for completion. Poll peaka_get_metadata_refresh_status to track progress until it reports COMPLETED or FAILED.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Refresh Project Metadata",
      readOnlyHint: false,
      destructiveHint: false,
    },
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
        handleToolError(error, log);
      }
    },
  });
};
