"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSetupAttentionContext } from "@/lib/setup-attention";
import { dismissSetupAttention } from "@/lib/server/setup-attention";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

type SetupAttentionBannerProps = {
  profile: Profile;
  holdingsCount: number;
};

export function SetupAttentionBanner({
  profile,
  holdingsCount,
}: SetupAttentionBannerProps) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState(false);
  const context = getSetupAttentionContext(profile, holdingsCount);

  if (!context.shouldShow) {
    return null;
  }

  async function handleDismiss() {
    setDismissing(true);
    const result = await dismissSetupAttention();
    setDismissing(false);

    if (result.ok) {
      router.refresh();
    }
  }

  const message = context.isNotInvestedYet
    ? "You have not added actual holdings yet. After you invest manually, add your holdings so PortfolioPilot can track future monthly plans."
    : "You have not added actual holdings yet. After you invest, add your holdings so PortfolioPilot can track future monthly plans.";

  return (
    <Alert className="mx-4 mt-4 rounded-lg border-primary/30 bg-primary/5 md:mx-6">
      <AlertTitle>Initial investment setup</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/holdings"
            className={cn(buttonVariants({ size: "sm", variant: "default" }))}
          >
            Add holdings
          </Link>
          <Link
            href="/onboarding?mode=resume"
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          >
            Return to setup
          </Link>
          {context.isNotInvestedYet && (
            <Link
              href="/initial-recommendation"
              className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
            >
              Generate initial recommendation
            </Link>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissing}
          >
            {dismissing ? "Dismissing..." : "Dismiss"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
