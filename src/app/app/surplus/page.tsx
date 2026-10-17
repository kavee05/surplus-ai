import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Inventory } from "./inventory";

export const metadata: Metadata = {
  title: "Surplus inventory",
  description: "Every logged surplus item across townships, with condition, age and value.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inventory />
    </Suspense>
  );
}
