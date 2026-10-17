import type { Metadata } from "next";
import { Activity } from "./activity";

export const metadata: Metadata = {
  title: "Activity",
  description: "A record of every decision on a recommendation: what was shown, how strong the evidence was, and what the person decided.",
};

export default function Page() {
  return <Activity />;
}
