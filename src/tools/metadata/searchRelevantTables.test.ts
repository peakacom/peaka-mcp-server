import { describe, expect, it, vi } from "vitest";
import { registerMetadataTools } from "./index";
import { registerSearchRelevantTablesTool } from "./searchRelevantTables";

const mocks = vi.hoisted(() => ({ search: vi.fn(), resolve: vi.fn() }));
vi.mock("../../context", () => ({ resolveService: mocks.resolve }));
function definition() {
  let tool: any;
  registerSearchRelevantTablesTool({ addTool: (value: unknown) => { tool = value; } } as any);
  mocks.resolve.mockReturnValue({ searchRelevantTables: mocks.search });
  return tool;
}
describe("relevant table MCP tool", () => {
  it("registers an additive read-only tool without removing metadata/discovery tools", () => {
    const names: string[] = [];
    registerMetadataTools({ addTool: (tool: any) => names.push(tool.name) } as any);
    expect(names).toContain("peaka_search_relevant_tables");
    expect(names).toContain("peaka_get_project_metadata");
    expect(names).toContain("peaka_refresh_project_metadata");
    expect(definition().annotations.readOnlyHint).toBe(true);
  });
  it.each(["ready", "partial", "empty", "unavailable"])("preserves %s and fallback guidance", async status => {
    const tool = definition();
    const result = { status, tables: [], coverage: "unknown", nextAction: "List schemas, then tables." };
    mocks.search.mockResolvedValue(result);
    const session = { accessToken: "test-only", readonly: true };
    const args = tool.parameters.parse({ projectId: "p", question: "patient visits" });
    const response = await tool.execute(args, { session, log: {} });
    expect(mocks.resolve).toHaveBeenCalledWith(session);
    expect(mocks.search).toHaveBeenCalledWith("p", "patient visits", 5);
    expect(JSON.parse(response.content[0].text)).toMatchObject({ status, coverage: "unknown", nextAction: result.nextAction, tables: [] });
  });
  it("returns each candidate as one row, with column names capped and a note when the index is not built", async () => {
    const tool = definition();
    const columns = Array.from({ length: 45 }, (_, i) => ({ name: `c${i}`, type: "varchar", desc: "x".repeat(200) }));
    mocks.search.mockResolvedValue({
      status: "partial", index: "not_built", coverage: "partial", nextAction: "List schemas.",
      tables: [{ catalogId: "1", schemaName: "payment", tableName: "event_invoices", table: "stripe.payment.event_invoices",
                 desc: "<p>List events, going back up to 30 days. Each event data is rendered.</p>", columns, foundBy: "text" }],
    });
    const response = await tool.execute(tool.parameters.parse({ projectId: "p", question: "charges" }), { session: {}, log: {} });
    const body = JSON.parse(response.content[0].text);
    expect(body.note).toContain("not_built");
    expect(body.tables).toEqual([["stripe.payment.event_invoices", "1", "List events, going back up to 30 days.", 45,
      `${columns.slice(0, 40).map(c => c.name).join(", ")}, … (+5)`]]);
  });
  it.each([{ question: " " }, { question: "x".repeat(2001) }, { limit: 0 }, { limit: 11 }, { limit: 1.5 }])
    ("rejects unbounded/invalid input", invalid => {
      expect(() => definition().parameters.parse({ projectId: "p", question: "patients", ...invalid })).toThrow();
    });
});
