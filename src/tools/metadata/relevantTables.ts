/** A candidate table as the search service returns it (older responses name the description `description`). */
interface RelevantTable {
  catalogId: string;
  schemaName: string;
  tableName: string;
  table?: string;
  catalog?: string;
  desc?: string | null;
  description?: string | null;
  columns?: { name: string }[];
  foundBy?: string;
}

interface RelevantTablesBody {
  status?: string;
  reason?: string | null;
  index?: string;
  coverage?: string;
  nextAction?: string;
  tables?: RelevantTable[];
}

/** Column names shown per candidate; the rest are counted, and peaka_list_columns gives them all. */
export const CANDIDATE_COLUMN_NAMES = 40;

const firstSentence = (text: string | null | undefined): string => {
  const plain = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const end = plain.search(/[.!?](\s|$)/);
  return end === -1 ? plain : plain.slice(0, end + 1);
};

/**
 * Shapes the relevant-table search result for the model: each candidate's name, the first sentence of its
 * description, its column count and up to {@link CANDIDATE_COLUMN_NAMES} column names. The full columns with types
 * and descriptions (one 238-column Stripe table alone is about 51 KB) are left to peaka_list_columns, so the
 * response is not saved to a file the model sees only the start of. Without a built index the candidates come
 * from text matching, and the response says so first.
 */
export const compactRelevantTables = (body: RelevantTablesBody) => {
  const tables = body.tables ?? [];
  return {
    status: body.status,
    index: body.index,
    coverage: body.coverage,
    ...(body.index && body.index !== "up_to_date"
      ? { note: `The AI index is ${body.index}: candidates come from matching names and descriptions and may be wrong. Check them, or list the catalog's schemas and tables.` }
      : {}),
    nextAction: body.nextAction,
    columns: ["table", "catalogId", "description", "columnCount", "columnNames"],
    tables: tables.map((t) => {
      const names = (t.columns ?? []).map((c) => c.name);
      const shown = names.slice(0, CANDIDATE_COLUMN_NAMES).join(", ");
      return [
        t.table ?? `${t.catalog ?? t.catalogId}.${t.schemaName}.${t.tableName}`,
        t.catalogId,
        firstSentence(t.desc ?? t.description),
        names.length,
        names.length > CANDIDATE_COLUMN_NAMES ? `${shown}, … (+${names.length - CANDIDATE_COLUMN_NAMES})` : shown,
      ];
    }),
  };
};
