import { describe, it, expect, vi } from "vitest";
import { AxiosError } from "axios";
import { UserError } from "fastmcp";
import { handleToolError } from "./error";

function grabThrow(fn: () => void): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe("handleToolError", () => {
  it("logs an http tool error server-side and returns a UserError, without leaking the token or query", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = {
      method: "get",
      url: "data/projects/P1/catalogs?search=secret-term",
      headers: { Authorization: "Bearer super-secret-token" },
    };
    const response = {
      status: 500,
      statusText: "Internal Server Error",
      data: { message: "downstream boom", code: 500 },
      headers: {},
      config,
    };
    const err = new AxiosError(
      "Request failed with status code 500",
      "ERR_BAD_RESPONSE",
      config as never,
      undefined,
      response as never,
    );

    const thrown = grabThrow(() =>
      handleToolError(err, undefined, { tool: "peaka_list_catalogs" }),
    );
    expect(thrown).toBeInstanceOf(UserError);

    const line = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(line).toContain("[tool-error]");
    expect(line).toContain("tool=peaka_list_catalogs");
    expect(line).toContain("type=http");
    expect(line).toContain("status=500");
    expect(line).toContain("GET data/projects/P1/catalogs");
    expect(line).toContain("downstream boom");
    // never leak the bearer token or the query string
    expect(line).not.toContain("super-secret-token");
    expect(line).not.toContain("Authorization");
    expect(line).not.toContain("search=secret-term");

    spy.mockRestore();
  });

  const axiosErrorWith = (status: number, data: unknown) => {
    const config = { method: "post", url: "data/projects/P1/queries/execute", headers: {} };
    return new AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_REQUEST",
      config as never,
      undefined,
      { status, statusText: "", data, headers: {}, config } as never,
    );
  };
  const payloadOf = (thrown: unknown) =>
    JSON.parse((thrown as UserError).message) as Record<string, unknown>;

  it("forwards Problem Details (detail, code, retryable, params, trimmed cause) and never debug", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = axiosErrorWith(422, {
      type: "https://docs.peaka.com/errors/query-failed",
      title: "Query failed",
      status: 422,
      detail: "Syntax error at line 1, column 1: mismatched input 'SELEC'.",
      instance: "/api/v1/data/projects/P1/queries/execute",
      code: "QUERY_FAILED",
      traceId: "trace-123",
      params: { line: 1, column: 1 },
      cause: {
        system: "trino",
        code: "SYNTAX_ERROR",
        type: "USER_ERROR",
        message: "line 1:1: mismatched input 'SELEC'",
        location: { line: 1, column: 1 },
      },
      retryable: false,
      debug: { exception: "java.lang.RuntimeException", at: ["io.code2.Internal:133"] },
    });

    const thrown = grabThrow(() =>
      handleToolError(err, undefined, { tool: "peaka_execute_sql_query" }),
    );
    expect(thrown).toBeInstanceOf(UserError);
    expect(payloadOf(thrown)).toEqual({
      code: "QUERY_FAILED",
      status: 422,
      message: "Syntax error at line 1, column 1: mismatched input 'SELEC'.",
      retryable: false,
      params: { line: 1, column: 1 },
      cause: {
        code: "SYNTAX_ERROR",
        message: "line 1:1: mismatched input 'SELEC'",
        location: { line: 1, column: 1 },
      },
    });
    expect((thrown as UserError).message).not.toContain("io.code2");

    const line = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(line).toContain("code=QUERY_FAILED");
    expect(line).toContain("traceId=trace-123");
    expect(line).toContain("mismatched input");
    expect(line).not.toContain("io.code2");
    spy.mockRestore();
  });

  it("still reads the legacy {errorCode, message} body", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrown = grabThrow(() =>
      handleToolError(
        axiosErrorWith(400, {
          errorCode: 100,
          message: "There are already a catalog with same name!!",
        }),
      ),
    );
    expect(payloadOf(thrown)).toEqual({
      code: 100,
      status: 400,
      message: "There are already a catalog with same name!!",
    });
    spy.mockRestore();
  });

  it("falls back to the HTTP status and axios message when the body is not usable", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrown = grabThrow(() =>
      handleToolError(axiosErrorWith(502, "<html>Bad Gateway</html>")),
    );
    expect(payloadOf(thrown)).toEqual({
      code: 502,
      status: 502,
      message: "Request failed with status code 502",
    });
    spy.mockRestore();
  });

  it("logs and re-throws an unexpected error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrown = grabThrow(() => handleToolError(new Error("kaboom")));
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe("kaboom");
    expect(spy.mock.calls.map((c) => String(c[0])).join("\n")).toContain(
      "type=unexpected",
    );
    spy.mockRestore();
  });

  it("passes a UserError through unchanged (still logged)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const original = new UserError("bad input");
    const thrown = grabThrow(() => handleToolError(original));
    expect(thrown).toBe(original);
    expect(spy.mock.calls.map((c) => String(c[0])).join("\n")).toContain("type=user");
    spy.mockRestore();
  });
});
