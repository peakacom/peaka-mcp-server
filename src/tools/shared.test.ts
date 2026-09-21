import { describe, it, expect } from "vitest";
import { requireWrite } from "./shared";
import type { PeakaSession } from "../types";

const session = (over: Partial<PeakaSession> = {}): PeakaSession => ({
  accessToken: "t",
  ...over,
});

describe("requireWrite", () => {
  it("hides write tools on a read-only connection", () => {
    expect(requireWrite(session({ readonly: true }))).toBe(false);
  });

  it("exposes write tools on a full connection", () => {
    expect(requireWrite(session({ readonly: false }))).toBe(true);
    expect(requireWrite(session())).toBe(true);
  });

  it("exposes write tools when there is no session (stdio mode)", () => {
    expect(requireWrite(undefined)).toBe(true);
  });
});
