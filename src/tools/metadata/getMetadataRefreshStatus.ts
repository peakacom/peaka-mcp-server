import { UserError } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";

export const registerGetMetadataRefreshStatusTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_metadata_refresh_status",
    description:
      `Check the current status of a metadata refresh job for a specific catalog. Possible statuses: NOT_ACTIVE, COMPLETED, WAITING, ACTIVE, DELAYED, FAILED, PAUSED, STUCK.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z
        .string()
        .describe("The catalog ID to check refresh status for."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getMetadataRefreshStatus(
          args.projectId,
          args.catalogId
        );
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
