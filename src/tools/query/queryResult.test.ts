import { describe, expect, it } from "vitest";
import { MAX_CELL_CHARS, MAX_RESULT_ROWS, boundQueryResult, compactQueryResult } from "./queryResult";
import type { QueryResult } from "../../types";

const column = (columnName: string) => ({
  catalogId: "1",
  catalogName: "samplebank_oracle",
  schemaName: "samplebank",
  tableName: "transactions",
  columnName,
});

const cell = (name: string, dataType: string, value: string | null, order: number) =>
  ({ name, displayName: name, dataType, value, order }) as QueryResult["data"][number][number];

describe("compactQueryResult", () => {
  it("lists each column's name and type once and rows as value arrays in column order", () => {
    const result: QueryResult = {
      columns: [column("status"), column("n")],
      data: [
        [cell("n", "bigint", "42", 1), cell("status", "varchar(12)", "Completed", 0)],
        [cell("status", "varchar(12)", null, 0), cell("n", "bigint", "7", 1)],
      ],
    };

    expect(compactQueryResult(result)).toEqual({
      columns: [
        { name: "status", type: "varchar(12)" },
        { name: "n", type: "bigint" },
      ],
      rows: [
        ["Completed", "42"],
        [null, "7"],
      ],
    });
  });

  it("keeps the column names of an empty result, without types", () => {
    const result: QueryResult = { columns: [column("status"), column("n")], data: [] };

    expect(compactQueryResult(result)).toEqual({
      columns: [
        { name: "status", type: null },
        { name: "n", type: null },
      ],
      rows: [],
    });
  });

  it("is smaller than the CELL_TYPED body it replaces", () => {
    const result: QueryResult = {
      columns: [column("status"), column("n")],
      data: Array.from({ length: 20 }, (_, i) => [
        cell("status", "varchar(12)", "Completed", 0),
        cell("n", "bigint", String(i), 1),
      ]),
    };

    expect(JSON.stringify(compactQueryResult(result)).length).toBeLessThan(
      JSON.stringify(result).length / 4
    );
  });
});

describe("boundQueryResult (DEV-4186)", () => {
  const columns = [{ name: "id", type: "bigint" }, { name: "note", type: "varchar" }];

  it("leaves a small result whole and says how many rows it has", () => {
    expect(boundQueryResult({ columns, rows: [["1", "a"], ["2", null]] }, 40_000)).toEqual({
      columns, rows: [["1", "a"], ["2", null]], returnedRows: 2, totalRows: 2,
    });
  });

  it("shows the rows that fit, marks the cut and tells the model to aggregate", () => {
    const rows = Array.from({ length: 5_000 }, (_, i) => [String(i), "x".repeat(50)]);
    const bounded = boundQueryResult({ columns, rows }, 40_000);
    expect(bounded.truncated).toBe(true);
    expect(bounded.totalRows).toBe(5_000);
    expect(bounded.returnedRows).toBe(bounded.rows.length);
    expect(bounded.returnedRows).toBeLessThan(MAX_RESULT_ROWS + 1);
    expect(JSON.stringify(bounded).length).toBeLessThanOrEqual(40_000);
    expect(bounded.note).toMatch(/aggregate in SQL/);
  });

  it("caps the rows even when they are small", () => {
    const rows = Array.from({ length: 2_000 }, (_, i) => [String(i), null]);
    expect(boundQueryResult({ columns, rows }, 1_000_000).returnedRows).toBe(MAX_RESULT_ROWS);
  });

  it("cuts a long value and counts it", () => {
    const bounded = boundQueryResult({ columns, rows: [["1", "y".repeat(MAX_CELL_CHARS + 10)]] }, 40_000);
    expect(bounded.rows[0][1]).toBe(`${"y".repeat(MAX_CELL_CHARS)}… (+10 characters)`);
    expect(bounded).toMatchObject({ truncatedCells: 1, returnedRows: 1, totalRows: 1 });
    expect(bounded.truncated).toBeUndefined();
  });
});

describe("read tables in query results (DEV-4186)", () => {
  const columns = [{ name: "n", type: "bigint" }];

  it("says when a SaaS table was read live or from a cache still filling", () => {
    const bounded = boundQueryResult({
      columns, rows: [["100"]],
      tables: [
        { table: "stripe.payment.invoices", cache: "live" },
        { table: "stripe.payment.charges", cache: "preparing" },
        { table: "stripe.payment.customers", cache: "ready" },
      ],
    }, 40_000);
    expect(bounded.tables).toHaveLength(3);
    expect(bounded.note).toContain("stripe.payment.invoices was read live");
    expect(bounded.note).toContain("The cache of stripe.payment.charges has not finished");
    expect(bounded.note).not.toContain("customers");
  });

  it("adds nothing for a result without SaaS tables", () => {
    expect(boundQueryResult({ columns, rows: [["1"]] }, 40_000)).toEqual({ columns, rows: [["1"]], returnedRows: 1, totalRows: 1 });
  });
});
