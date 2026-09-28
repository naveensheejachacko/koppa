import { describe, expect, it } from "vitest";
import { endOfUtcWeek, startOfUtcWeek } from "./week.js";

describe("utc week", () => {
  it("starts on Monday 00:00 UTC", () => {
    const wednesday = new Date("2026-09-30T15:00:00.000Z");
    const start = startOfUtcWeek(wednesday);
    expect(start.toISOString()).toBe("2026-09-28T00:00:00.000Z");
    expect(endOfUtcWeek(wednesday).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });
});
