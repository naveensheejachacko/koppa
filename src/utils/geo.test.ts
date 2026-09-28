import { describe, expect, it } from "vitest";
import { haversineKm, isValidCoordinate, kmToMeters } from "./geo.js";

describe("haversineKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineKm(11.2588, 75.7804, 11.2588, 75.7804)).toBeLessThan(0.001);
  });

  it("computes Kozhikode-scale distances", () => {
    const km = haversineKm(11.2588, 75.7804, 11.2597, 75.7804);
    expect(km).toBeGreaterThan(0.09);
    expect(km).toBeLessThan(0.12);
    expect(kmToMeters(km)).toBeGreaterThan(90);
    expect(kmToMeters(km)).toBeLessThan(120);
  });
});

describe("isValidCoordinate", () => {
  it("rejects out-of-range values", () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(11.25, 75.78)).toBe(true);
  });
});
