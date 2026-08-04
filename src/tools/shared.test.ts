import { describe, it, expect } from "vitest";
import { CACHE_SCHEDULE_SCHEMA } from "./shared";

describe("CACHE_SCHEDULE_SCHEMA", () => {
  it("accepts a recurring BASIC schedule with an ISO-8601 duration", () => {
    for (const expression of ["PT6H", "P1D", "P7D", "P30D", "PT30M", "PT1H"]) {
      const r = CACHE_SCHEDULE_SCHEMA.safeParse({ type: "BASIC", expression });
      expect(r.success, expression).toBe(true);
    }
  });

  it("accepts {type:'NONE'} to disable a schedule", () => {
    const r = CACHE_SCHEDULE_SCHEMA.safeParse({ type: "NONE" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ type: "NONE" });
  });

  it("rejects the old flat duration string (must be an object now)", () => {
    expect(CACHE_SCHEDULE_SCHEMA.safeParse("P7D").success).toBe(false);
  });

  it("rejects BASIC without an expression", () => {
    expect(CACHE_SCHEDULE_SCHEMA.safeParse({ type: "BASIC" }).success).toBe(false);
  });

  it("rejects invalid durations instead of silently falling back", () => {
    for (const bad of ["", "NONE", "6h", "P", "1D", "abc", "PT"]) {
      const r = CACHE_SCHEDULE_SCHEMA.safeParse({ type: "BASIC", expression: bad });
      expect(r.success, bad).toBe(false);
    }
  });

  it("rejects an unknown type", () => {
    expect(
      CACHE_SCHEDULE_SCHEMA.safeParse({ type: "BASICX", expression: "PT6H" }).success
    ).toBe(false);
  });
});
