import { describe, expect, it } from "vitest";
import { projectTableListText } from "./listProjectTables";

describe("peaka_list_project_tables text", () => {
  it("writes the count and legend, then the lines as the API wrote them", () => {
    expect(projectTableListText({
      status: "listed", scope: {}, tables: 2, tokens: 40, legend: "One line per table.",
      list: "stripe.payment.charges [cached]: Charges. | columns: id, amount\nbank.core.accounts: Accounts. | columns: id",
    })).toBe("2 tables. One line per table.\n\nstripe.payment.charges [cached]: Charges. | columns: id, amount\nbank.core.accounts: Accounts. | columns: id");
  });

  it("writes a scope too large to list as its schemas and what to do next", () => {
    expect(projectTableListText({
      status: "too_large", reason: "too_many_tables", scope: {}, tables: 900,
      schemas: [{ catalog: "stripe", catalogId: "9", schema: "payment", tables: 500 }, { catalog: "bank", catalogId: "7", schema: "core", tables: 400 }],
      nextAction: "List one of these schemas.",
    })).toBe([
      "Too large to list whole (900 tables, over 400). List one of these schemas.",
      "Schemas (catalog.schema, catalogId, tables):",
      "stripe.payment, 9, 500",
      "bank.core, 7, 400",
    ].join("\n"));
  });
});
