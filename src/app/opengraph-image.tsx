import { ImageResponse } from "next/og";

export const alt = "Surplus AI: check before you buy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const bars = [
    { label: "City of Elmina, Phase 3", left: 80, width: 520, marker: 600, r: 30 },
    { label: "Bandar Bukit Raja, Phase 2B", left: 760, width: 300, marker: 0, r: 0 },
    { label: "Serenia City, Phase 1C", left: 140, width: 640, marker: 780, r: 16 },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F6F7F5", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0F4C5C", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#F2A541" }} />
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#142126" }}>Surplus AI</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, color: "#142126", marginTop: 48, lineHeight: 1.05, maxWidth: 900 }}>
          Check before you buy.
        </div>
        <div style={{ fontSize: 30, color: "#5A6A70", marginTop: 16, maxWidth: 900 }}>
          Forecast construction surplus across township sites before the order is placed.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 56 }}>
          {bars.map((b) => (
            <div key={b.label} style={{ display: "flex", position: "relative", height: 26 }}>
              <div style={{ position: "absolute", left: b.left, width: b.width, height: 26, borderRadius: 6, background: "#0F4C5C", opacity: 0.85 }} />
              {b.r > 0 && (
                <div style={{ position: "absolute", left: b.marker - b.r, top: 13 - b.r, width: b.r * 2, height: b.r * 2, borderRadius: b.r, background: "#F2A541", opacity: 0.9 }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 20, color: "#5A6A70" }}>Student prototype. Simulated data. Not affiliated with Sime Darby Property.</div>
      </div>
    ),
    size,
  );
}
