import type { Metadata } from "next";
import { Impact } from "./impact";

export const metadata: Metadata = {
  title: "Impact",
  description: "Management dashboard: money saved, tonnes diverted, illustrative carbon avoided, forecast accuracy and alerts across townships.",
};

export default function Page() {
  return <Impact />;
}
