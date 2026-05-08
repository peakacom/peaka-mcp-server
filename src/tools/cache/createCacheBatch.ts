import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import type { CreateCacheRequest } from "../../types";
import { handleToolError } from "../../error";

export const registerCreateCacheBatchTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_cache_batch",
    description:
      `Create caches for multiple tables in a single call. Use this instead of repeated peaka_create_cache calls when caching many tables — it avoids partial-failure states where some caches are created and others aren't. Each item supports the same optional schedule expressions as peaka_create_cache (ISO-8601 durations, e.g. PT6H, P1D, P7D, P30D).

    ${PROJECT_ID_HINT}`,
    annotations: {
      title: "Create Cache Batch",
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      items: z
        .array(
          z.object({
            catalogId: z.string(),
            schemaName: z.string(),
            tableName: z.string(),
            incrementalSchedule: z
              .string()
              .optional()
              .describe(
                "Optional ISO-8601 duration for the incremental refresh schedule, e.g. PT6H, P1D."
              ),
            fullRefreshSchedule: z
              .string()
              .optional()
              .describe(
                "Optional ISO-8601 duration for the full refresh schedule, e.g. P7D, P30D."
              ),
          })
        )
        .min(1)
        .describe("Tables to cache. Must contain at least one item."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const items: CreateCacheRequest[] = args.items.map((item) => {
          const body: CreateCacheRequest = {
            catalogId: item.catalogId,
            schemaName: item.schemaName,
            tableName: item.tableName,
          };
          if (item.incrementalSchedule) {
            body.incrementalCacheSchedule = {
              type: "BASIC",
              expression: item.incrementalSchedule,
            };
          }
          if (item.fullRefreshSchedule) {
            body.fullRefreshCacheSchedule = {
              type: "BASIC",
              expression: item.fullRefreshSchedule,
            };
          }
          return body;
        });

        const svc = resolveService(session);
        const result = await svc.createCacheBatch(args.projectId, items);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
