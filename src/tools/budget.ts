import type { FastMCP } from "fastmcp";
import type { PeakaSession } from "../types";

/**
 * Every tool answer is kept under this many characters (about 10,000 tokens). Clients differ in what they do with a
 * larger one: Claude Code saves it to a file and shows the model the first 2 KB, an agent platform may refuse it as
 * too large for its context. Either way the model loses the data, so the server says what to narrow instead.
 */
export const RESPONSE_BUDGET_CHARS = 40_000;

/** What to do instead, per tool, when its answer is over the budget. */
const NARROW: Record<string, string> = {
  peaka_get_project_metadata:
    'Choose the tables with peaka_list_project_tables and pass them as tables=["catalog.schema.table", ...], a few at a time; or scope by catalogId and schemaName.',
  peaka_list_project_tables: "List one catalog or schema with catalogId and schemaName.",
  peaka_list_tables: "Pass tableNameContains to list only the tables you need.",
  peaka_list_columns: "Read the table's columns with peaka_get_project_metadata and tables=[...] in compact format.",
  peaka_list_table_metadata: "Ask for a smaller page with limit, or scope by catalogId and schemaName.",
  peaka_search_relevant_tables: "Ask for fewer candidates with limit.",
  peaka_get_relations: "Read the relations of the tables you need with peaka_get_project_metadata and tables=[...].",
  peaka_list_queries: "Look up the query you need with peaka_get_query.",
};
const NARROW_DEFAULT = "Ask for a narrower scope.";

/** An answer over the budget becomes a short one saying how large it was and how to narrow the request. */
export const withinBudget = <T>(tool: string, result: T): T => {
  const content: { type?: string; text?: string }[] | undefined =
    typeof result === "string"
      ? [{ type: "text", text: result }]
      : (result as { content?: { type?: string; text?: string }[] } | undefined)?.content;
  if (!Array.isArray(content)) return result;
  const size = content.reduce((total, part) => total + (part?.type === "text" ? part.text?.length ?? 0 : 0), 0);
  if (size <= RESPONSE_BUDGET_CHARS) return result;
  return ({
    content: [{
      type: "text",
      text: JSON.stringify({
        tooLarge: true,
        characters: size,
        budget: RESPONSE_BUDGET_CHARS,
        note: `The answer of ${tool} is ${size.toLocaleString("en-US")} characters, over the ${RESPONSE_BUDGET_CHARS.toLocaleString("en-US")} a tool answer may have, so it is not shown. ${NARROW[tool] ?? NARROW_DEFAULT}`,
      }),
    }],
  }) as T;
};

/**
 * Registers tools through a server whose addTool keeps every answer within the budget, so no tool can hand a client
 * more than it can show, whichever tool and however it was called.
 */
export const budgetedServer = (server: FastMCP<PeakaSession>): FastMCP<PeakaSession> =>
  new Proxy(server, {
    get(target, property, receiver) {
      if (property !== "addTool") return Reflect.get(target, property, receiver);
      return (tool: Parameters<FastMCP<PeakaSession>["addTool"]>[0]) =>
        target.addTool({
          ...tool,
          execute: async (args, context) => withinBudget(tool.name, await tool.execute(args, context)),
        });
    },
  });
