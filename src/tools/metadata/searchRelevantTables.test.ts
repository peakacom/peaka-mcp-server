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
    expect(JSON.parse(response.content[0].text)).toEqual(result);
  });
  it.each([{ question: " " }, { question: "x".repeat(2001) }, { limit: 0 }, { limit: 11 }, { limit: 1.5 }])
    ("rejects unbounded/invalid input", invalid => {
      expect(() => definition().parameters.parse({ projectId: "p", question: "patients", ...invalid })).toThrow();
    });
});
