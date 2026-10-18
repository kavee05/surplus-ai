"use client";

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** "How this was calculated" drawer. Every number in the Radar has one. */
export function Explain({
  title,
  lines,
  children,
  label = "How this was calculated",
  className,
  iconOnly = false,
}: {
  title: string;
  lines: string[];
  children?: React.ReactNode;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size={iconOnly ? "icon-sm" : "sm"} className={cn("text-muted-foreground", className)} aria-label={iconOnly ? `${label}: ${title}` : undefined}>
          <Calculator className="size-3.5" aria-hidden />
          {!iconOnly && label}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Deterministic arithmetic from the assumptions on the Settings page. No AI model is involved.</SheetDescription>
        </SheetHeader>
        <ol className="flex flex-col gap-3 px-6 pb-8">
          {lines.map((l, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{i + 1}</span>
              <span className="pt-0.5 text-pretty">{l}</span>
            </li>
          ))}
        </ol>
        {children && <div className="px-4 pb-6">{children}</div>}
      </SheetContent>
    </Sheet>
  );
}
