import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Transfers } from "./transfers";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Track every transfer from Matched to Completed, with engineer approval for structural items and a record of every decision.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Transfers />
    </Suspense>
  );
}
