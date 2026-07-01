"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  EyeIcon,
  LayoutDashboardIcon,
  NewspaperIcon,
  PieChartIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
};

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/holdings",
    label: "Holdings",
    icon: BriefcaseIcon,
  },
  {
    href: "/monthly-plan",
    label: "Monthly plan",
    icon: CalendarIcon,
  },
  {
    href: "/instructions",
    label: "Instructions",
    icon: BookOpenIcon,
  },
  {
    href: "/news-input",
    label: "News input",
    icon: NewspaperIcon,
  },
  {
    href: "/settings/allocations",
    label: "Allocations",
    icon: PieChartIcon,
  },
  {
    href: "/settings/watchlist",
    label: "Watchlist",
    icon: EyeIcon,
  },
] as const;

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="font-heading text-base font-semibold text-sidebar-foreground"
        >
          PortfolioPilot
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Long-term investing dashboard
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
