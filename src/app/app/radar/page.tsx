import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { RadarView } from "./radar-view";

export const metadata: Metadata = {
  title: "Surplus Radar",
  description: "Forecast surplus across township phases and run a Pre-Order Check before buying new material.",
};

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <RadarView />
    </Suspense>
  );
}
