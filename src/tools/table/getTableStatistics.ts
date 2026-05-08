import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerGetTableStatisticsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_get_table_statistics",
    description:
      `Get column-level statistics for a table in the Peaka project. Returns the catalog/schema/table identifiers and a per-column distinctFraction (estimated fraction of distinct values vs total rows), useful for cardinality estimation and query optimization.

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Get Table Statistics",
      readOnlyHint: true,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      catalogId: z.string(),
      schemaName: z.string(),
      tableName: z.string(),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.getTableStatistics(
          args.projectId,
          args.catalogId,
          args.schemaName,
          args.tableName
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
