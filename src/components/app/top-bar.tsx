"use client";

import { ChevronDown, Home, LogOut, PlayCircle, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { toast } from "sonner";
import { useDemo } from "@/components/demo/guided-demo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { people } from "@/data/seed";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { usePalette } from "./command-palette";
import { allNav } from "./nav";
import { SimulatedBadge } from "./simulated-badge";

const roles: { id: Role; label: string }[] = [
  { id: "engineer", label: "Site engineer" },
  { id: "procurement", label: "Procurement officer" },
  { id: "management", label: "Management" },
];

const extraCrumbs: Record<string, string> = { log: "Log surplus" };

function Crumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const trail = parts.map((p, i) => {
    const href = "/app/" + parts.slice(0, i + 1).join("/");
    const label = allNav.find((n) => n.href === href)?.label ?? extraCrumbs[p] ?? p;
    return { href, label };
  });
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap whitespace-nowrap">
        <BreadcrumbItem className="hidden sm:inline-flex">
          {trail.length ? <BreadcrumbLink asChild><Link href="/app">Overview</Link></BreadcrumbLink> : <BreadcrumbPage>Overview</BreadcrumbPage>}
        </BreadcrumbItem>
        {trail.map((c, i) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator className={i === trail.length - 1 ? "hidden sm:inline-flex" : "hidden xl:inline-flex"} />
            <BreadcrumbItem className={i === trail.length - 1 ? "min-w-0" : "hidden xl:inline-flex"}>
              {i === trail.length - 1 ? (
                <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function TopBar() {
  const { state, dispatch, person } = useStore();

  const { start } = useDemo();
  const { open: openPalette } = usePalette();
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Crumbs />
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={openPalette} className="gap-2 text-muted-foreground" aria-label="Search pages and actions (Control or Command K)">
          <Search aria-hidden />
          <span className="hidden lg:inline">Search or jump to</span>
          <kbd className="hidden rounded border bg-muted px-1 font-mono text-[10px] lg:inline">Ctrl K</kbd>
        </Button>
        <span className="flex flex-col items-end leading-tight whitespace-nowrap" title="All dates in the demo are relative to this fixed date">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Demo date</span>
          <span className="tabular text-xs font-medium">{fmtDate(state.today)}</span>
        </span>
        <SimulatedBadge className="hidden md:inline-flex" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label={`${person.name} ${person.title}, user menu`}>
              <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-semibold text-primary-foreground" aria-hidden>{initials}</span>
              <span className="hidden flex-col items-start leading-tight lg:flex">
                <span className="text-sm font-medium">{person.name}</span>
                <span className="text-xs text-muted-foreground">{person.title}</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">View the app as (fictional people)</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.role}
              onValueChange={(v) => {
                dispatch({ type: "setRole", role: v as Role });
                toast.success(`Now viewing as ${people[v as Role].title.toLowerCase()}`);
              }}
            >
              {roles.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id}>
                  <span className="flex flex-col">
                    <span>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{people[r.id].name}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => start()}>
              <PlayCircle aria-hidden /> Start guided demo
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                dispatch({ type: "reset" });
                toast.success("Demo data reset to the original simulated seed.");
              }}
            >
              <RotateCcw aria-hidden /> Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <Home aria-hidden /> Back to website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LogOut aria-hidden /> No sign-in in this prototype
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

/** Shown once when saved demo data could not be used and the seed was loaded instead. */
export function StorageNotice() {
  const { notice, clearNotice } = useStore();
  if (!notice) return null;
  return (
    <div role="status" className="flex items-start justify-between gap-3 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning sm:px-6 lg:px-8">
      <span>{notice} You are looking at the original simulated seed.</span>
      <button type="button" onClick={clearNotice} className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline">
        Dismiss
      </button>
    </div>
  );
}
