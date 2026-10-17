import type { Metadata } from "next";
import { Needs } from "./needs";

export const metadata: Metadata = {
  title: "Needs",
  description: "Material that sites need, with ranked matches from logged surplus and a plain explanation of each match.",
};

export default function Page() {
  return <Needs />;
}
