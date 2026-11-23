import type { Table } from "../../types";

/** A table's cache state in one word: the model reads it from the list, not from a field per row. */
export type TableCacheState = "cached" | "not_cached" | "not_cacheable";

export interface CompactTableList {
  catalogId: string | null;
  catalog: string | null;
  schema: string | null;
  /** Tables in the schema before the name filter, so a filtered list is not read as the whole schema. */
  totalTables: number;
  columns: string[];
  tables: (string | boolean)[][];
}

const cacheState = (table: Table): TableCacheState =>
  table.isCached ? "cached" : table.isCacheable ? "not_cached" : "not_cacheable";

const plainText = (html: string): string =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/**
 * Shapes a schema's table list for the model: the catalog and schema once, then one row per table with its name
 * and cache state, and whether it is a dynamic table only when the schema has one. Descriptions are left out unless
 * asked for (as plain text): a large schema's descriptions (Stripe's payment schema: 152 tables, about 64 KB) make
 * the client save the response to a file, and the model then misses the cache state of most tables.
 */
export const compactTableList = (
  tables: (Table & { desc?: string | null })[],
  options: { nameContains?: string; includeDescriptions?: boolean } = {}
): CompactTableList => {
  const needle = options.nameContains?.toLowerCase();
  const picked = needle ? tables.filter((t) => t.tableName.toLowerCase().includes(needle)) : tables;
  const withDynamic = tables.some((t) => t.isDynamicTable);
  const columns = ["table", "cache", ...(withDynamic ? ["dynamic"] : []), ...(options.includeDescriptions ? ["description"] : [])];
  return {
    catalogId: tables[0]?.catalogId ?? null,
    catalog: tables[0]?.catalogName ?? null,
    schema: tables[0]?.schemaName ?? null,
    totalTables: tables.length,
    columns,
    tables: picked.map((t) => [
      t.tableName,
      cacheState(t),
      ...(withDynamic ? [t.isDynamicTable] : []),
      ...(options.includeDescriptions ? [plainText(t.desc ?? "")] : []),
    ]),
  };
};
