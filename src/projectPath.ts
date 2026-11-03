import http from "http";
import type { AddressInfo } from "net";

/**
 * The project-preselected MCP endpoint (DEV-4244): a connection URL of the form
 * `https://<host>/p/{projectId}/mcp` names the single project the client is
 * configured for. fastmcp matches its stream endpoint path exactly, so a small
 * front proxy on the public port rewrites that form to `/mcp` and hands the
 * request to the fastmcp server on the loopback port. The original path
 * travels in the {@link FORWARDED_PATH_HEADER} so the 401 challenge can point
 * at the path-inserted protected-resource metadata — which is what makes the
 * consent screen preselect the project. Everything else (/mcp, /health, /ready)
 * passes through untouched.
 *
 * Enforcement does not live here: the token minted from the consent is bound
 * to the project server-side, and a restricted token's project listing already
 * narrows to its grant, so tools keep taking explicit projectId arguments.
 */
export const FORWARDED_PATH_HEADER = "x-peaka-forwarded-path";

const PROJECT_PATH = /^\/p\/([A-Za-z0-9_-]+)(\/mcp(?:\/.*)?)$/;

export interface RewrittenTarget {
  url: string;
  forwardedPath?: string;
}

/** `/p/{id}/mcp[?query]` → `/mcp[?query]` plus the original path; anything else passes through. */
export function rewriteProjectPath(requestUrl: string): RewrittenTarget {
  const queryStart = requestUrl.indexOf("?");
  const pathname = queryStart === -1 ? requestUrl : requestUrl.slice(0, queryStart);
  const query = queryStart === -1 ? "" : requestUrl.slice(queryStart);
  const match = PROJECT_PATH.exec(pathname);
  if (!match) {
    return { url: requestUrl };
  }
  return { url: `${match[2]}${query}`, forwardedPath: pathname };
}

export interface FrontProxyOptions {
  publicPort: number;
  publicHost: string;
  internalPort: number;
}

/** Starts the public-facing proxy in front of the loopback fastmcp server. */
export function startFrontProxy(options: FrontProxyOptions): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const target = rewriteProjectPath(req.url ?? "/");

    const headers = { ...req.headers };
    // the header states what THIS proxy saw, never what a client claims
    delete headers[FORWARDED_PATH_HEADER];
    if (target.forwardedPath) {
      headers[FORWARDED_PATH_HEADER] = target.forwardedPath;
    }

    const upstream = http.request(
      {
        host: "127.0.0.1",
        port: options.internalPort,
        method: req.method,
        path: target.url,
        headers,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstream.on("error", (error) => {
      console.error("[proxy] upstream request failed:", error.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
      }
      res.end(JSON.stringify({ error: "bad_gateway" }));
    });

    req.pipe(upstream);
  });

  // streamable HTTP holds responses open; never kill them from the proxy side
  server.keepAliveTimeout = 0;
  server.headersTimeout = 0;
  server.requestTimeout = 0;

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.publicPort, options.publicHost, () => {
      const address = server.address() as AddressInfo;
      console.error(
        `[proxy] public endpoint on ${options.publicHost}:${address.port}, fastmcp on 127.0.0.1:${options.internalPort}`,
      );
      resolve(server);
    });
  });
}
