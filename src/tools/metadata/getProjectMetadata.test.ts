import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { registerGetProjectMetadataTool } from "./getProjectMetadata";

/**
 * peaka_get_project_metadata (2026-10-20): without format the tool returns the stored metadata as before; format
 * asks the API for compact JSON or DDL text and passes it through unindented; samples only with a format.
 */
describe("peaka_get_project_metadata format", () => {
  const requests: string[] = [];
  let server: Server;
  let tool: { execute: (args: Record<string, unknown>, ctx: unknown) => Promise<{ content: { text: string }[] }> };

  beforeAll(async () => {
    server = createServer((req, res) => {
      requests.push(req.url ?? "");
      const url = new URL(req.url ?? "", "http://x");
      const format = url.searchParams.get("format");
      if (format === "ddl") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("CREATE TABLE c.s.t (\n  a bigint\n);\n");
      } else if (format === "compact") {
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ tables: [{ table: "c.s.t", columns: [{ name: "a", type: "bigint" }] }] }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
          metadata: [{ id: "1", content: "c.s.t", metadata: { tableName: "t", columns: [
            { columnName: "a", columnDescription: "null", isSystem: false, isCategorical: false, categoricalValues: [] },
            { columnName: "_sys", isSystem: true },
          ] } }],
        }));
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    process.env.TRANSPORT = "httpStream";
    process.env.PARTNER_API_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    registerGetProjectMetadataTool({ addTool: (definition: typeof tool) => (tool = definition) } as never);
  });

  afterAll(() => {
    server.close();
    delete process.env.TRANSPORT;
    delete process.env.PARTNER_API_BASE_URL;
  });

  const call = (args: Record<string, unknown>) =>
    tool.execute({ projectId: "p", ...args }, { log: { error() {}, warn() {}, info() {} }, session: { accessToken: "t" } });

  it("without format returns the stored metadata as before", async () => {
    const result = await call({ catalogId: "1" });
    const body = JSON.parse(result.content[0].text);
    expect(body.metadata[0].metadata.columns).toEqual([{ columnName: "a", columnDescription: "", isSystem: false }]);
    expect(result.content[0].text).toContain("\n  ");
    expect(requests.at(-1)).toBe("/metadata/p?catalogId=1");
  });

  it("compact and ddl come back as the API wrote them, samples only when asked", async () => {
    const compact = await call({ format: "compact" });
    expect(compact.content[0].text).toBe('{"tables":[{"table":"c.s.t","columns":[{"name":"a","type":"bigint"}]}]}');
    expect(requests.at(-1)).toBe("/metadata/p?format=compact");

    const ddl = await call({ format: "ddl", catalogId: "1", schemaName: "my schema", includeSamples: true });
    expect(ddl.content[0].text).toBe("CREATE TABLE c.s.t (\n  a bigint\n);\n");
    expect(requests.at(-1)).toBe("/metadata/p?format=ddl&catalogId=1&schemaName=my+schema&include=samples");
  });

  it("refuses samples without a format", async () => {
    await expect(call({ includeSamples: true })).rejects.toThrow(/needs format/);
  });
});
