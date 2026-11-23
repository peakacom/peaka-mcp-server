import http from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  FORWARDED_PATH_HEADER,
  rewriteProjectPath,
  startFrontProxy,
} from "./projectPath";
import { resourceMetadataUrl } from "./auth";

describe("rewriteProjectPath", () => {
  it("rewrites the project-preselected form to the stream endpoint", () => {
    expect(rewriteProjectPath("/p/dAJr8mCm/mcp")).toEqual({
      url: "/mcp",
      forwardedPath: "/p/dAJr8mCm/mcp",
    });
  });

  it("keeps the query string", () => {
    expect(rewriteProjectPath("/p/x1/mcp?readonly=true&timeoutSeconds=120")).toEqual({
      url: "/mcp?readonly=true&timeoutSeconds=120",
      forwardedPath: "/p/x1/mcp",
    });
  });

  it("passes everything else through", () => {
    expect(rewriteProjectPath("/mcp")).toEqual({ url: "/mcp" });
    expect(rewriteProjectPath("/health")).toEqual({ url: "/health" });
    expect(rewriteProjectPath("/p//mcp")).toEqual({ url: "/p//mcp" });
    expect(rewriteProjectPath("/p/x1/other")).toEqual({ url: "/p/x1/other" });
  });
});

describe("resourceMetadataUrl with a forwarded project path", () => {
  it("builds the path-inserted metadata URL", () => {
    expect(
      resourceMetadataUrl({
        host: "mcp-test.peaka.host",
        "x-peaka-forwarded-path": "/p/dAJr8mCm/mcp",
      }),
    ).toBe(
      "https://mcp-test.peaka.host/.well-known/oauth-protected-resource/p/dAJr8mCm/mcp",
    );
  });

  it("ignores a forwarded path that is not the project form", () => {
    expect(
      resourceMetadataUrl({
        host: "mcp-test.peaka.host",
        "x-peaka-forwarded-path": "/../evil",
      }),
    ).toBe("https://mcp-test.peaka.host/.well-known/oauth-protected-resource");
  });
});

describe("startFrontProxy", () => {
  let upstream: http.Server;
  let proxy: http.Server;
  let upstreamPort: number;
  let proxyPort: number;
  let lastRequest: { url?: string; forwardedPath?: string | string[] };

  beforeAll(async () => {
    lastRequest = {};
    upstream = http.createServer((req, res) => {
      lastRequest = {
        url: req.url,
        forwardedPath: req.headers[FORWARDED_PATH_HEADER],
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    upstreamPort = (upstream.address() as { port: number }).port;

    proxy = await startFrontProxy({
      publicPort: 0,
      publicHost: "127.0.0.1",
      internalPort: upstreamPort,
    });
    proxyPort = (proxy.address() as { port: number }).port;
  });

  afterAll(() => {
    proxy.close();
    upstream.close();
  });

  it("rewrites the project path and states the original in its own header", async () => {
    const response = await fetch(
      `http://127.0.0.1:${proxyPort}/p/dAJr8mCm/mcp?readonly=true`,
      {
        method: "POST",
        // a client-sent value of the proxy's header must never survive
        headers: { [FORWARDED_PATH_HEADER]: "/p/evil/mcp" },
        body: "{}",
      },
    );

    expect(response.status).toBe(200);
    expect(lastRequest.url).toBe("/mcp?readonly=true");
    expect(lastRequest.forwardedPath).toBe("/p/dAJr8mCm/mcp");
  });

  it("passes other paths through without the header", async () => {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/health`, {
      headers: { [FORWARDED_PATH_HEADER]: "/p/evil/mcp" },
    });

    expect(response.status).toBe(200);
    expect(lastRequest.url).toBe("/health");
    expect(lastRequest.forwardedPath).toBeUndefined();
  });
});
