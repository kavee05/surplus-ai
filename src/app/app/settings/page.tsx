import type { Metadata } from "next";
import { Settings } from "./settings";

export const metadata: Metadata = {
  title: "Assumptions",
  description: "Every assumption behind the forecasts and savings, the surplus ownership policy, and demo data controls.",
};

export default function Page() {
  return <Settings />;
}
