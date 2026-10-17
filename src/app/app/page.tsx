import type { Metadata } from "next";
import { Overview } from "./overview";

export const metadata: Metadata = {
  title: "Overview",
  description: "Your surplus workspace: forecast surplus, logged surplus, open needs and transfers across townships.",
};

export default function Page() {
  return <Overview />;
}
