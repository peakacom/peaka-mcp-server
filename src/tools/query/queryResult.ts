import type { QueryResult } from "../../types";

export interface CompactQueryResult {
  columns: { name: string; type: string | null }[];
  rows: (string | null)[][];
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
  return { columns, rows };
};
