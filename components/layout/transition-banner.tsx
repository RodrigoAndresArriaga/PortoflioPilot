"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { cn } from "@/lib/utils";

const DISMISS_STORAGE_KEY = "portfolio-pilot-transition-dismissed";

type TransitionBannerProps = {
  lifecycle: PortfolioLifecycleSnapshot;
};

function readDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(DISMISS_STORAGE_KEY) === "true";
}

export function TransitionBanner({ lifecycle }: TransitionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  const shouldShow = lifecycle.transition.shouldShow && !dismissed;

  if (!shouldShow) {
    return null;
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setDismissed(true);
  }

  const newsNote = lifecycle.monthlyPlanReadiness.usesNeutralNewsDefaults
    ? "No weekly news report was found — the engine will use neutral news defaults. You can still generate your plan manually."
    : "Latest weekly news context is available for plan generation.";

  return (
    <Alert className="mx-4 mt-4 rounded-lg border-secondary/40 bg-secondary/10 md:mx-6">
      <AlertTitle>Ready for your first regular monthly plan</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          You added holdings after your initial recommendation. Review and
          generate your first regular monthly plan when you are ready — nothing
          is created automatically.
        </p>
        <p className="text-sm text-muted-foreground">{newsNote}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/monthly-plan"
            className={cn(buttonVariants({ size: "sm", variant: "default" }))}
          >
            Review monthly plan
          </Link>
          <Link
            href="/holdings"
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          >
            View holdings
          </Link>
          <Button type="button" size="sm" variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function clearTransitionDismissed() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
  }
}
