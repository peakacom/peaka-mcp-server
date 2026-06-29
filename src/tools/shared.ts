import { z } from "zod";
import type { ProjectMetadataResponse, ColumnMetadata } from "../types";

export const PROJECT_ID_HINT =
  "If you do not already know the projectId for the current task, call peaka_list_projects first and ask the user which project to use. Remember the chosen projectId for subsequent calls in this conversation.";

// Auto-refresh schedule for MATERIALIZED queries. Two forms: a fixed interval
// (ISO-8601 duration) or a cron expression with an IANA timezone.
export const QUERY_SCHEDULE_SCHEMA = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("interval"),
      repeatDuration: z
        .string()
        .describe(
          "ISO-8601 duration between refreshes, e.g. PT6H (6 hours), P1D (1 day)."
        ),
    }),
    z.object({
      type: z.literal("cron"),
      cronExpression: z
        .string()
        .describe("Cron expression, e.g. 0 0 * * * for daily at midnight."),
      timezone: z
        .string()
        .default("UTC")
        .describe("IANA timezone used to evaluate the cron expression, e.g. UTC, Europe/Istanbul."),
    }),
    z.object({
      type: z.literal("none"),
    }),
  ])
  .describe(
    "Auto-refresh schedule for MATERIALIZED queries. Use {type: 'interval', repeatDuration}, {type: 'cron', cronExpression, timezone}, or {type: 'none'} to disable an existing schedule. Ignored for PLAIN queries."
  );

// Filters metadata to reduce token usage for LLMs:
// - Removes system columns (e.g. _q_pagination_anchor, _q_offset)
// - Strips isCategorical when false
// - Strips categoricalValues when empty
// - Normalizes columnDescription from string "null" to ""
export function filterMetadataResponse(data: ProjectMetadataResponse): ProjectMetadataResponse {
  return {
    metadata: data.metadata.map((entry) => ({
      ...entry,
      metadata: {
        ...entry.metadata,
        columns: entry.metadata.columns
          ?.filter((col) => !col.isSystem)
          .map((col) => {
            const filtered: ColumnMetadata = { ...col };
            if (filtered.columnDescription === "null") {
              filtered.columnDescription = "";
            }
            if (!filtered.isCategorical) {
              delete filtered.isCategorical;
            }
            if (
              !filtered.categoricalValues ||
              filtered.categoricalValues.length === 0
            ) {
              delete filtered.categoricalValues;
            }
            return filtered;
          }),
      },
    })),
  };
}
