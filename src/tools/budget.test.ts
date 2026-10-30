import { describe, expect, it } from "vitest";
import { RESPONSE_BUDGET_CHARS, budgetedServer, withinBudget } from "./budget";

describe("response budget (DEV-4186)", () => {
  it("passes an answer within the budget through unchanged", () => {
    const result = { content: [{ type: "text", text: "x".repeat(RESPONSE_BUDGET_CHARS) }] };
    expect(withinBudget("peaka_list_tables", result)).toBe(result);
  });

  it("replaces an answer over the budget with its size and how to narrow it", () => {
    const result = withinBudget("peaka_get_project_metadata", { content: [{ type: "text", text: "x".repeat(844_000) }] });
    const body = JSON.parse(result.content[0].text);
    expect(body).toMatchObject({ tooLarge: true, characters: 844_000, budget: RESPONSE_BUDGET_CHARS });
    expect(body.note).toContain("tables=");
  });

  it("wraps every tool registered through the budgeted server", async () => {
    const added: { execute: (args: unknown, context: unknown) => Promise<unknown> }[] = [];
    const server = budgetedServer({ addTool: (tool: never) => added.push(tool) } as never);
    server.addTool({ name: "peaka_list_columns", execute: async () => ({ content: [{ type: "text", text: "y".repeat(50_000) }] }) } as never);
    const body = JSON.parse(((await added[0].execute({}, {})) as { content: { text: string }[] }).content[0].text);
    expect(body).toMatchObject({ tooLarge: true, characters: 50_000 });
  });
});
