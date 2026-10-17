import type { Metadata } from "next";
import { LogSurplus } from "./log-surplus";

export const metadata: Metadata = {
  title: "Log surplus",
  description: "Log leftover material from a photo. The AI suggests the item, condition and an estimated quantity; you confirm before saving.",
};

export default function Page() {
  return <LogSurplus />;
}
