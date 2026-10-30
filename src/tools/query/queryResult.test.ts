import { describe, expect, it } from "vitest";
import { compactQueryResult } from "./queryResult";
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
