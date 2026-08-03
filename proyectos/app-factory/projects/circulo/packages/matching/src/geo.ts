import type { ApproximateLocation } from '@circulo/types';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Distance between two approximate locations. Inputs are already coarse
 * (rounded server-side), so the result is an estimate, never a precise fix.
 */
export function distanceKm(a: ApproximateLocation, b: ApproximateLocation): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Coarsening applied before any coordinate may be sent to a client. */
export function coarsen(location: ApproximateLocation): ApproximateLocation {
  return {
    ...location,
    lat: Math.round(location.lat * 10) / 10,
    lon: Math.round(location.lon * 10) / 10,
  };
}
