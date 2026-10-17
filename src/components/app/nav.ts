import {
  ArrowLeftRight,
  BarChart3,
  BookOpenCheck,
  Boxes,
  ClipboardList,
  Flag,
  HandHeart,
  LayoutDashboard,
  Radar,
  SlidersHorizontal,
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
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/app/impact", label: "Impact", icon: BarChart3 },
      { href: "/app/community", label: "Community route", icon: HandHeart },
      { href: "/app/pilot", label: "Pilot plan", icon: Flag },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/app/evidence", label: "Evidence", icon: BookOpenCheck },
      { href: "/app/settings", label: "Assumptions", icon: SlidersHorizontal },
    ],
  },
];

export const allNav = navGroups.flatMap((g) => g.items);
