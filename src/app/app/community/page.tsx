import type { Metadata } from "next";
import { Community } from "./community";

export const metadata: Metadata = {
  title: "Community route",
  description: "Surplus left unclaimed for too long can be offered to simulated community projects in the same township.",
};

export default function Page() {
  return <Community />;
}
