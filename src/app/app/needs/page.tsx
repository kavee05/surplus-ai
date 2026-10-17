import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Needs } from "./needs";

export const metadata: Metadata = {
  title: "Needs",
  description: "Material that sites need, with ranked matches from logged surplus, the evidence behind each match, and approve or reject decisions.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Needs />
    </Suspense>
  );
}
