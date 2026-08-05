import { describe, it, expect, vi } from "vitest";
import { AxiosError } from "axios";
import { APIService } from "./api.service";
import type { Organization, Workspace, Project } from "./types";

function svc(): APIService {
  return new APIService({ accessToken: "test", baseUrl: "http://example.test" });
}

const org = (id: string): Organization =>
  ({ id, name: `org-${id}` } as unknown as Organization);
const ws = (id: string): Workspace =>
  ({ id, name: `ws-${id}` } as unknown as Workspace);
const proj = (id: string): Project =>
  ({ id, name: `proj-${id}` } as unknown as Project);

function forbidden(): AxiosError {
  return new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 403,
    statusText: "Forbidden",
    data: {},
    headers: {},
    config: {} as never,
  });
}

function serverError(): AxiosError {
  return new AxiosError("Server Error", "ERR_BAD_RESPONSE", undefined, undefined, {
    status: 500,
    statusText: "Internal Server Error",
    data: {},
    headers: {},
    config: {} as never,
  });
}

describe("listAllProjects", () => {
  it("skips a forbidden workspace, returns the others, and reports the skip", async () => {
    const s = svc();
    vi.spyOn(s, "listOrganizations").mockResolvedValue([org("o1")]);
    vi.spyOn(s, "listWorkspaces").mockResolvedValue([ws("w1"), ws("w2")]);
    vi.spyOn(s, "listProjects").mockImplementation(async (_orgId, wsId) => {
      if (wsId === "w2") throw forbidden();
      return [proj("p1")];
    });

    const { projects, forbidden: skipped } = await s.listAllProjects();
    expect(projects.map((r) => r.projectId)).toEqual(["p1"]); // w2 skipped, not fatal
    expect(skipped).toEqual(["org-o1 / ws-w2"]); // surfaced, not silent
  });

  it("skips an org whose workspaces are forbidden and reports it", async () => {
    const s = svc();
    vi.spyOn(s, "listOrganizations").mockResolvedValue([org("o1"), org("o2")]);
    vi.spyOn(s, "listWorkspaces").mockImplementation(async (orgId) => {
      if (orgId === "o2") throw forbidden();
      return [ws("w1")];
    });
    vi.spyOn(s, "listProjects").mockResolvedValue([proj("p1")]);

    const { projects, forbidden: skipped } = await s.listAllProjects();
    expect(projects.map((r) => r.projectId)).toEqual(["p1"]);
    expect(skipped).toEqual(["org-o2 (all workspaces)"]);
  });

  it("reports all workspaces as forbidden when every projects call 403s (the test-env case)", async () => {
    const s = svc();
    vi.spyOn(s, "listOrganizations").mockResolvedValue([org("o1")]);
    vi.spyOn(s, "listWorkspaces").mockResolvedValue([ws("w1"), ws("w2")]);
    vi.spyOn(s, "listProjects").mockRejectedValue(forbidden());

    const { projects, forbidden: skipped } = await s.listAllProjects();
    expect(projects).toEqual([]);
    expect(skipped).toEqual(["org-o1 / ws-w1", "org-o1 / ws-w2"]);
  });

  it("propagates non-403 errors instead of silently returning a partial list", async () => {
    const s = svc();
    vi.spyOn(s, "listOrganizations").mockResolvedValue([org("o1")]);
    vi.spyOn(s, "listWorkspaces").mockResolvedValue([ws("w1")]);
    vi.spyOn(s, "listProjects").mockRejectedValue(serverError());

    await expect(s.listAllProjects()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
