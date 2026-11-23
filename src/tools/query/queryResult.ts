import type { QueryReadTable, QueryResult } from "../../types";

export interface CompactQueryResult {
  columns: { name: string; type: string | null }[];
  rows: (string | null)[][];
  /** The SaaS tables read and how; only when the answer has them. */
  tables?: QueryReadTable[];
}

/**
 * Shapes a CELL_TYPED query result for the model: each column's name and type
 * once, then rows as plain value arrays in column order.
 *
 * The gateway's own COMPACT format is not used because it drops the column
 * types, and both its formats repeat the catalog, schema and table of every
 * column, which for computed columns (aggregates, joins) names a table the
 * value does not come from. CELL_TYPED carries the type on every cell, so the
 * types are taken from the first row; an empty result falls back to the
 * column names with no type.
 */
export const compactQueryResult = (result: QueryResult): CompactQueryResult => {
  const data = result.data ?? [];
  const firstRow = [...(data[0] ?? [])].sort((a, b) => a.order - b.order);
  const columns =
    firstRow.length > 0
      ? firstRow.map((cell) => ({ name: cell.name, type: cell.dataType ?? null }))
      : (result.columns ?? []).map((column) => ({ name: column.columnName, type: null }));
  const rows = data.map((row) =>
    [...row].sort((a, b) => a.order - b.order).map((cell) => cell.value ?? null)
  );
  return { columns, rows, ...(result.tables?.length ? { tables: result.tables } : {}) };
};

/** Rows shown to the model at most; past this, the SQL should aggregate. */
export const MAX_RESULT_ROWS = 500;
/** One cell's characters at most (a JSON or text column can be long); the rest is counted. */
export const MAX_CELL_CHARS = 2_000;

export interface BoundedQueryResult extends CompactQueryResult {
  /** Rows shown. */
  returnedRows: number;
  /** Rows the query returned to Peaka's API; more than returnedRows when truncated. */
  totalRows: number;
  truncated?: true;
  truncatedCells?: number;
  note?: string;
}

const cut = (value: string | null): { value: string | null; cut: boolean } =>
  value !== null && value.length > MAX_CELL_CHARS
    ? { value: `${value.slice(0, MAX_CELL_CHARS)}… (+${value.length - MAX_CELL_CHARS} characters)`, cut: true }
    : { value, cut: false };

/**
 * A query result within a row and a character budget (DEV-4186): long cells are cut, then rows are shown while they
 * fit. A cut result says so (truncated, returnedRows of totalRows) and tells the model to aggregate or narrow in SQL
 * rather than generalise from the rows shown; there is no continuation to page through.
 */
export const boundQueryResult = (result: CompactQueryResult, budgetChars: number): BoundedQueryResult => {
  let truncatedCells = 0;
  const rows = result.rows.map((row) =>
    row.map((cell) => {
      const shown = cut(cell);
      if (shown.cut) truncatedCells += 1;
      return shown.value;
    })
  );
  const header = JSON.stringify({ columns: result.columns }).length + 400;
  const kept: (string | null)[][] = [];
  let size = header;
  for (const row of rows) {
    const rowSize = JSON.stringify(row).length + 1;
    if (kept.length >= MAX_RESULT_ROWS || size + rowSize > budgetChars) break;
    kept.push(row);
    size += rowSize;
  }
  const truncated = kept.length < rows.length;
  const live = (result.tables ?? []).filter((table) => table.cache === "live").map((table) => table.table);
  const preparing = (result.tables ?? []).filter((table) => table.cache === "preparing").map((table) => table.table);
  const notes = [
    live.length
      ? `${live.join(", ")} ${live.length > 1 ? "were" : "was"} read live from a SaaS source, and a live read may return only the first page of records: do not present the result as complete.`
      : "",
    preparing.length
      ? `The cache of ${preparing.join(", ")} has not finished its first sync, so it may be empty or partial.`
      : "",
    truncated
      ? `Only the first ${kept.length} of ${rows.length} rows are shown. Do not generalise from them: aggregate in SQL (COUNT, SUM, GROUP BY) or narrow it with WHERE.`
      : "",
    truncatedCells ? `${truncatedCells} long values are cut to ${MAX_CELL_CHARS} characters.` : "",
  ].filter(Boolean);
  return {
    columns: result.columns,
    ...(result.tables ? { tables: result.tables } : {}),
    rows: kept,
    returnedRows: kept.length,
    totalRows: rows.length,
    ...(truncated ? { truncated: true as const } : {}),
    ...(truncatedCells ? { truncatedCells } : {}),
    ...(notes.length ? { note: notes.join(" ") } : {}),
  };
};
