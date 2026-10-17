import type { Metadata } from "next";
import { RadarView } from "./radar-view";

export const metadata: Metadata = {
  title: "Surplus Radar",
  description: "Forecast surplus across township phases and run a Pre-Order Check before buying new material.",
};

export default function Page() {
  return <RadarView />;
}
