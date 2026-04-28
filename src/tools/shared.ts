import type { ProjectMetadataResponse, ColumnMetadata } from "../types";

export const PROJECT_ID_HINT =
  "If you do not already know the projectId for the current task, call peaka_list_projects first and ask the user which project to use. Remember the chosen projectId for subsequent calls in this conversation.";

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
