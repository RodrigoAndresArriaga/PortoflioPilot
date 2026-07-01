"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon } from "lucide-react";

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
] as const;

const comingSoonItems = ["Holdings", "Settings"] as const;

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
          const isActive = pathname === item.href;
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

        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">
            Coming soon
          </p>
          {comingSoonItems.map((label) => (
            <div
              key={label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
            >
              {label}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
