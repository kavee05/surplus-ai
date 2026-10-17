import type { Metadata } from "next";
import { AppSidebar } from "@/components/app/app-sidebar";
import { TopBar } from "@/components/app/top-bar";
import { GuidedDemoProvider } from "@/components/demo/guided-demo";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: { default: "Overview", template: "%s · Surplus AI" },
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuidedDemoProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-40 sm:px-6 lg:px-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </GuidedDemoProvider>
  );
}
