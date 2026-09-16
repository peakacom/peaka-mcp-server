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
