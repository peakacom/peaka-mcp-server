import { describe, expect, it } from "vitest";
import { compactTableList } from "./tableList";
import type { Table } from "../../types";

const table = (tableName: string, over: Partial<Table & { desc: string }> = {}) => ({
  catalogId: "1",
  catalogName: "stripe",
  schemaName: "payment",
  tableName,
  isCacheable: true,
  isDynamicTable: false,
  isCached: false,
  desc: "<p>Returns a <b>list</b> of objects.</p>",
  ...over,
});

describe("compactTableList", () => {
  const tables = [
    table("charges", { isCached: true }),
    table("invoices"),
    table("event_charges"),
    table("patients", { isCacheable: false }),
  ];

  it("names the catalog and schema once and gives one name + cache state row per table", () => {
    expect(compactTableList(tables)).toEqual({
      catalogId: "1",
      catalog: "stripe",
      schema: "payment",
      totalTables: 4,
      columns: ["table", "cache"],
      tables: [
        ["charges", "cached"],
        ["invoices", "not_cached"],
        ["event_charges", "not_cached"],
        ["patients", "not_cacheable"],
      ],
    });
  });

  it("filters by name ignoring case and keeps the schema's full size", () => {
    const list = compactTableList(tables, { nameContains: "CHARGES" });
    expect(list.tables).toEqual([
      ["charges", "cached"],
      ["event_charges", "not_cached"],
    ]);
    expect(list.totalTables).toBe(4);
  });

  it("adds descriptions as plain text only when asked", () => {
    const list = compactTableList([table("charges")], { includeDescriptions: true });
    expect(list.columns).toEqual(["table", "cache", "description"]);
    expect(list.tables[0][2]).toBe("Returns a list of objects.");
  });

  it("adds the dynamic column only when the schema has a dynamic table", () => {
    const list = compactTableList([table("charges"), table("search_charges", { isDynamicTable: true })]);
    expect(list.columns).toEqual(["table", "cache", "dynamic"]);
    expect(list.tables).toEqual([
      ["charges", "not_cached", false],
      ["search_charges", "not_cached", true],
    ]);
  });

  it("handles an empty schema", () => {
    expect(compactTableList([])).toMatchObject({ catalog: null, totalTables: 0, tables: [] });
  });
});
