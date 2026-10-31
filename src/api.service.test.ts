import { describe, it, expect } from "vitest";
import { APIService } from "./api.service";
import { DEFAULT_TIMEOUT_MS, PEAKA_MCP_USER_AGENT } from "./constants";

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

describe("APIService user agent", () => {
  it("names the Peaka MCP server and its version", () => {
    const svc = new APIService({ accessToken: "t" });
    const headers = (
      svc as unknown as { axiosInstance: { defaults: { headers: Record<string, unknown> } } }
    ).axiosInstance.defaults.headers;
    expect(headers["User-Agent"]).toBe(PEAKA_MCP_USER_AGENT);
    expect(PEAKA_MCP_USER_AGENT).toMatch(/^peaka-mcp-server\/\d+\.\d+\.\d+$/);
  });
});

describe("APIService catalog and schema listings", () => {
  const withGets = (routes: Record<string, unknown>) => {
    const svc = new APIService({ accessToken: "t" });
    const calls: { url: string; params?: unknown }[] = [];
    (svc as unknown as { axiosInstance: { get: unknown } }).axiosInstance.get = async (
      url: string,
      config?: { params?: unknown }
    ) => {
      calls.push({ url, params: config?.params });
      const key = Object.keys(routes).find((k) => url.includes(k));
      const body = key ? routes[key] : undefined;
      if (body instanceof Error) throw body;
      return { data: body };
    };
    return { svc, calls };
  };
  const catalogs = [
    { id: "10", name: "stripe", displayName: "stripe", catalogType: "stripe", connectionId: null },
    { id: "20", name: "crm", displayName: "crm", catalogType: "postgresql", connectionId: "c" },
  ];
  const described = {
    available: true,
    catalogs: [
      { catalogId: "10", description: "Stripe account.", schemas: [{ schemaName: "payment", description: "Charges." }] },
      { catalogId: "20", description: "", schemas: [] },
    ],
  };

  it("gives each catalog its description, and none to a catalog without one", async () => {
    const { svc } = withGets({ "/descriptions": described, catalogs });
    expect(await svc.listCatalogs("P")).toEqual([{ ...catalogs[0], description: "Stripe account." }, catalogs[1]]);
  });

  it("gives each schema of the catalog its description", async () => {
    const schemas = [
      { catalogId: "10", catalogName: "stripe", schemaName: "payment" },
      { catalogId: "10", catalogName: "stripe", schemaName: "billing" },
    ];
    const { svc, calls } = withGets({ "/descriptions": described, schemas });
    expect(await svc.listSchemas("P", "10")).toEqual([{ ...schemas[0], description: "Charges." }, schemas[1]]);
    expect(calls.find((c) => c.url.includes("/descriptions"))?.params).toEqual({ catalogId: "10" });
  });

  it("lists catalogs as before when descriptions cannot be read", async () => {
    const { svc } = withGets({ "/descriptions": new Error("404"), catalogs });
    expect(await svc.listCatalogs("P")).toEqual(catalogs);
  });
});
