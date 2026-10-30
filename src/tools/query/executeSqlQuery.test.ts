import { describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { registerExecuteSqlQueryTool } from "./executeSqlQuery";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), transpile: vi.fn(), resolve: vi.fn() }));
vi.mock("../../context", () => ({ resolveService: mocks.resolve }));

const tool = () => {
  let defined: any;
  registerExecuteSqlQueryTool({ addTool: (value: unknown) => { defined = value; } } as any);
  mocks.resolve.mockReturnValue({ executeSQLStatement: mocks.execute, transpileQueryToTrinoDialect: mocks.transpile });
  return defined;
};
const failure = (code: string) => new AxiosError("422", "ERR", undefined, undefined, {
  status: 422, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
  data: { code: "QUERY_FAILED", detail: "Syntax error at line 1, column 20", params: { line: 1, column: 20 }, cause: { code } },
});
const ok = { columns: [], data: [[{ name: "n", displayName: "n", dataType: "bigint", value: "1", order: 0 }]] };
const run = (query: string) => tool().execute({ projectId: "p", query }, { log: { error() {} }, reportProgress() {}, session: {} });

describe("peaka_execute_sql_query (DEV-4185)", () => {
  it("runs the SQL as written, without the transpiler", async () => {
    mocks.execute.mockReset().mockResolvedValue(ok);
    mocks.transpile.mockReset();
    const body = JSON.parse((await run("SELECT DATE '2025-01-01'")).content[0].text);
    expect(mocks.execute).toHaveBeenCalledWith("p", "SELECT DATE '2025-01-01'");
    expect(mocks.transpile).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty("ranAs");
  });

  it("tries the transpiled SQL once after a syntax error and says it ran that", async () => {
    mocks.execute.mockReset().mockRejectedValueOnce(failure("SYNTAX_ERROR")).mockResolvedValueOnce(ok);
    mocks.transpile.mockReset().mockResolvedValue({ query: "SELECT CAST(amount AS INTEGER) FROM t" });
    const body = JSON.parse((await run("SELECT amount::int FROM t")).content[0].text);
    expect(mocks.execute).toHaveBeenLastCalledWith("p", "SELECT CAST(amount AS INTEGER) FROM t");
    expect(body.ranAs).toBe("SELECT CAST(amount AS INTEGER) FROM t");
  });

  it("reports any other error as it is, without transpiling", async () => {
    mocks.execute.mockReset().mockRejectedValue(failure("COLUMN_NOT_FOUND"));
    mocks.transpile.mockReset();
    await expect(run("SELECT segmnt FROM t")).rejects.toThrow();
    expect(mocks.transpile).not.toHaveBeenCalled();
  });
});
