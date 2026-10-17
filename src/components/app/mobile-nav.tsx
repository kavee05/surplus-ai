"use client";

import { ArrowLeftRight, Camera, LayoutDashboard, Menu, Radar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const side = [
  { href: "/app", label: "Today", icon: LayoutDashboard },
  { href: "/app/radar", label: "Radar", icon: Radar },
];
const after = [{ href: "/app/transfers", label: "Transfers", icon: ArrowLeftRight }];

/**
 * Phone-only bottom bar. Log surplus sits in the middle, camera first, because
 * engineers on site use it most; for site engineers it is the raised primary button.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { state } = useStore();
  const { setOpenMobile } = useSidebar();
  const engineer = state.role === "engineer";
  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  const logActive = pathname.startsWith("/app/surplus/log");

  const tab = (n: (typeof side)[number]) => (
    <Link
      key={n.href}
      href={n.href}
      aria-current={active(n.href) ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground",
        active(n.href) && "text-brand",
      )}
    >
      <span className="grid size-7 place-items-center">
        <n.icon className="size-5" aria-hidden />
      </span>
      {n.label}
    </Link>
  );

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        {side.map(tab)}
        <Link
          href="/app/surplus/log"
          aria-current={logActive ? "page" : undefined}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium"
        >
          <span
            className={cn(
              "grid place-items-center rounded-xl transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.97]",
              engineer ? "-mt-5 size-12 bg-brand text-primary-foreground shadow-[var(--shadow-2)]" : "size-7 text-muted-foreground",
              !engineer && logActive && "text-brand",
            )}
          >
            <Camera className={engineer ? "size-6" : "size-5"} aria-hidden />
          </span>
          <span className={cn(engineer || logActive ? "text-brand" : "text-muted-foreground")}>Log surplus</span>
        </Link>
        {after.map(tab)}
        <button type="button" onClick={() => setOpenMobile(true)} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="grid size-7 place-items-center">
            <Menu className="size-5" aria-hidden />
          </span>
          More
        </button>
      </div>
    </nav>
  );
}
