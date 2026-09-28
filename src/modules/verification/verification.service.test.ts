import { describe, expect, it } from "vitest";
import { evaluateVisitLocation } from "./verification.service.js";

const cafe = { cafeLat: 11.2588, cafeLng: 75.7804 };

describe("evaluateVisitLocation", () => {
  it("verifies a point inside radius", () => {
    const result = evaluateVisitLocation({
      userLat: 11.2588,
      userLng: 75.7804,
      ...cafe,
      accuracy: 18,
      radiusMeters: 120,
      maxAccuracyMeters: 50,
    });
    expect(result.verified).toBe(true);
  });

  it("rejects a point outside radius", () => {
    const result = evaluateVisitLocation({
      userLat: 11.27,
      userLng: 75.79,
      ...cafe,
      accuracy: 10,
      radiusMeters: 120,
      maxAccuracyMeters: 50,
    });
    expect(result.verified).toBe(false);
    if (!result.verified) {
      expect(result.reason).toMatch(/radius/);
    }
  });

  it("rejects poor GPS accuracy", () => {
    const result = evaluateVisitLocation({
      userLat: 11.2588,
      userLng: 75.7804,
      ...cafe,
      accuracy: 80,
      radiusMeters: 120,
      maxAccuracyMeters: 50,
    });
    expect(result.verified).toBe(false);
    if (!result.verified) {
      expect(result.reason).toMatch(/accuracy/);
    }
  });
});
