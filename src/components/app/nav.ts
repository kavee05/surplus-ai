import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  Radar,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { href: "/app", label: "Overview", icon: LayoutDashboard },
      { href: "/app/radar", label: "Surplus Radar", icon: Radar },
      { href: "/app/surplus", label: "Surplus inventory", icon: Boxes },
      { href: "/app/needs", label: "Needs", icon: ClipboardList },
      { href: "/app/transfers", label: "Transfers", icon: ArrowLeftRight },
      { href: "/app/activity", label: "Activity", icon: History },
    ],
  },
];

export const allNav = navGroups.flatMap((g) => g.items);

/** Pages kept for slides and direct links, but left out of the menu. */
export const hiddenPages: Record<string, string> = {
  "/app/impact": "Impact",
  "/app/community": "Community route",
  "/app/pilot": "Pilot plan",
  "/app/evidence": "Evidence",
  "/app/settings": "Assumptions",
};
