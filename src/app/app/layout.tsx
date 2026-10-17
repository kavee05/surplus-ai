import type { Metadata } from "next";
import { AiStatusProvider } from "@/components/ai/ai-status";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CREDIT } from "@/components/landing/site-chrome";
import { TopBar } from "@/components/app/top-bar";
import { GuidedDemoProvider } from "@/components/demo/guided-demo";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: { default: "Overview", template: "%s · Surplus AI" },
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AiStatusProvider>
        <GuidedDemoProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <TopBar />
              <div
                id="main"
                className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-12 sm:px-6 lg:px-8"
              >
                {children}
              </div>
              <footer className="mx-auto w-full max-w-7xl border-t px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
                {CREDIT} Student prototype with simulated data. Not affiliated with Sime Darby Property.
              </footer>
            </SidebarInset>
          </SidebarProvider>
        </GuidedDemoProvider>
      </AiStatusProvider>
      <Toaster position="top-center" />
    </StoreProvider>
  );
}
