"use client";

import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "currency", label: "Currency" },
  { id: "monthly-amount", label: "Monthly amount" },
  { id: "investment-day", label: "Investment day" },
  { id: "risk-profile", label: "Risk profile" },
  { id: "time-horizon", label: "Time horizon" },
  { id: "target-allocation", label: "Target allocation" },
  { id: "watchlist", label: "Watchlist" },
  { id: "email", label: "Email" },
] as const;

export function SettingsAnchorNav() {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-2">
      {SETTINGS_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
