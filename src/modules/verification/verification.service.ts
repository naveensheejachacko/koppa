import { env } from "../../config/env.js";
import { haversineKm, isValidCoordinate, kmToMeters } from "../../utils/geo.js";
import { ValidationError } from "../../utils/errors.js";

export type LocationVerdict =
  | { verified: true; distanceMeters: number }
  | { verified: false; distanceMeters: number; reason: string };

export function evaluateVisitLocation(input: {
  userLat: number;
  userLng: number;
  cafeLat: number;
  cafeLng: number;
  accuracy?: number;
  radiusMeters?: number;
  maxAccuracyMeters?: number;
}): LocationVerdict {
  if (!isValidCoordinate(input.userLat, input.userLng)) {
    throw new ValidationError("Invalid coordinates");
  }
  const config = {
    radiusMeters: input.radiusMeters ?? env().VISIT_RADIUS_METERS,
    maxAccuracyMeters: input.maxAccuracyMeters ?? env().VISIT_MAX_GPS_ACCURACY_METERS,
  };
  const distanceMeters = kmToMeters(
    haversineKm(input.userLat, input.userLng, input.cafeLat, input.cafeLng),
  );
  if (input.accuracy !== undefined && input.accuracy > config.maxAccuracyMeters) {
    return { verified: false, distanceMeters, reason: "GPS accuracy too low" };
  }
  if (distanceMeters > config.radiusMeters) {
    return { verified: false, distanceMeters, reason: "Outside allowed visit radius" };
  }
  return { verified: true, distanceMeters };
}
