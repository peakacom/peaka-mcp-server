import { describe, it, expect } from "vitest";
import { APIService } from "./api.service";
import { DEFAULT_TIMEOUT_MS } from "./constants";

const timeoutOf = (svc: APIService): number | undefined =>
  (
    svc as unknown as {
      axiosInstance: { defaults: { timeout?: number } };
    }
  ).axiosInstance.defaults.timeout;

describe("APIService request timeout", () => {
  it("applies the provided timeoutMs to the axios instance", () => {
    const svc = new APIService({ accessToken: "t", timeoutMs: 120000 });
    expect(timeoutOf(svc)).toBe(120000);
  });

  it("falls back to the default when timeoutMs is omitted", () => {
    const svc = new APIService({ accessToken: "t" });
    expect(timeoutOf(svc)).toBe(DEFAULT_TIMEOUT_MS);
  });
});
