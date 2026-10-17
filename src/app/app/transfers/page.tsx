import type { Metadata } from "next";
import { Transfers } from "./transfers";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Track every transfer from Matched to Completed, with mandatory engineer approval for structural items.",
};

export default function Page() {
  return <Transfers />;
}
