import type { Category, TransferStatus } from "@/lib/types";

/** One colour language for both views. Matches the app tokens in globals.css. */
export const C = {
  ground: "#d6eadc",
  groundEdge: "#b3d0bf",
  pad: "#f8fafc",
  road: "#cbd5e1",
  ink: "#0f172a",
  building: "#e2e8f0",
  buildingAlt: "#cbd5e1",
  glass: "#7dd3fc",
  crane: "#f59e0b",
  brand: "#047857",
  brandStrong: "#065f46",
  success: "#15803d",
  available: "#22c55e",
  forecast: "#f59e0b",
  forecastInk: "#92400e",
  need: "#0284c7",
  landfill: "#8b7a66",
  landfillTop: "#a8957d",
  fence: "#94a3b8",
  select: "#10b981",
};

/** Body colour of each material pile. */
export const MATERIAL: Record<Category, string> = {
  "Tiles and finishes": "#e7e2d8",
  Timber: "#b7834f",
  Formwork: "#d9a86c",
  "Paving and landscape": "#b45f4b",
  Steel: "#64748b",
  "Aggregates and binders": "#d6c29a",
  "Concrete elements": "#9ca3af",
  "Safety and site supplies": "#f97316",
};

export function lorryColour(status: TransferStatus, onForecast: boolean) {
  if (onForecast) return C.forecast;
  if (status === "Collected") return C.brand;
  if (status === "Awaiting approval" || status === "Matched") return "#64748b";
  return C.brandStrong;
}

/** Lorries only drive once the load is reserved or collected; others wait at the source. */
export function lorryMoving(status: TransferStatus) {
  return status === "Reserved" || status === "Collected";
}
