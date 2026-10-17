import type { Metadata } from "next";
import { AiStatusProvider } from "@/components/ai/ai-status";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { MobileNav } from "@/components/app/mobile-nav";
import { CREDIT } from "@/components/landing/site-chrome";
import { StorageNotice, TopBar } from "@/components/app/top-bar";
import { GuidedDemoProvider } from "@/components/demo/guided-demo";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: { default: "Overview", template: "%s · Surplus AI" },
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <StoreProvider>
        <AiStatusProvider>
          <GuidedDemoProvider>
            <CommandPaletteProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0">
                  <TopBar />
                  <StorageNotice />
                  <div
                    id="main"
                    className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-12 sm:px-6 lg:px-8"
                  >
                    {children}
                  </div>
                  <footer className="mx-auto w-full max-w-7xl border-t px-4 py-4 pb-24 text-xs text-muted-foreground sm:px-6 md:pb-4 lg:px-8">
                    {CREDIT} Student prototype with simulated data. Not
                    affiliated with Sime Darby Property.
                  </footer>
                </SidebarInset>
                <MobileNav />
              </SidebarProvider>
            </CommandPaletteProvider>
          </GuidedDemoProvider>
        </AiStatusProvider>
        <Toaster position="top-center" />
      </StoreProvider>
    </TooltipProvider>
  );
}
