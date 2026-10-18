"use client";

import { PlayCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/logo";
import { useDemo } from "@/components/demo/guided-demo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navGroups } from "./nav";

export function AppSidebar() {
  const pathname = usePathname();
  const { start } = useDemo();
  const { state, setOpenMobile } = useSidebar();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <Link href="/" className="flex items-center rounded-md px-1" aria-label="Surplus AI home">
          {state === "collapsed" ? <LogoMark className="size-7" /> : <Logo />}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className="h-9 rounded-xl font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-semibold data-[active=true]:text-emerald-800 [&>svg]:size-[18px]"
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Start guided demo"
              className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-700 font-bold text-white shadow-[0_8px_18px_-8px_rgba(5,150,105,0.6)] hover:from-emerald-700 hover:to-sky-800 hover:text-white active:text-white"
              onClick={() => {
                setOpenMobile(false);
                start();
              }}
            >
              <PlayCircle aria-hidden />
              <span>Start guided demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
