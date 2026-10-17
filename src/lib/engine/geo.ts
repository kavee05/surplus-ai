import type { Site } from "../types";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km between two approximate coordinates. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function siteDistanceKm(sites: Site[], fromId: string, toId: string): number {
  if (fromId === toId) return 0;
  const a = sites.find((s) => s.id === fromId);
  const b = sites.find((s) => s.id === toId);
  if (!a || !b) return Infinity;
  return Math.round(haversineKm(a, b) * 10) / 10;
}
