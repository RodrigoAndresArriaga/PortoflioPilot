"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RecommendationCandidate } from "@/lib/engine/types";
import { previewOnboardingRecommendations } from "@/lib/server/onboarding-preview";
import type { OnboardingFormData } from "@/lib/validation/onboarding";

type RecommendationPreviewStepProps = {
  formData: OnboardingFormData;
  isResume?: boolean;
};

export function RecommendationPreviewStep({
  formData,
  isResume = false,
}: RecommendationPreviewStepProps) {
  const [recommendations, setRecommendations] = useState<
    RecommendationCandidate[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isNotInvestedYet = formData.investment_status === "not_invested_yet";

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError(null);

      const payload: OnboardingFormData = {
        ...formData,
        holdings: formData.holdings.map((holding) => ({
          ...holding,
          currency: formData.base_currency,
        })),
      };

      const result = await previewOnboardingRecommendations(payload);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setError(result.error);
        setRecommendations([]);
      } else {
        setRecommendations(result.data.slice(0, 5));
      }

      setLoading(false);
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [formData]);

  if (isNotInvestedYet && !isResume) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You can generate an initial manual investment recommendation after
          setup. Copy the personalized research prompt from Instructions, run it
          in ChatGPT manually, then paste the JSON on the initial recommendation
          page.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/instructions"
            className="font-medium text-primary underline underline-offset-4"
          >
            Open instructions
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/initial-recommendation"
            className="font-medium text-primary underline underline-offset-4"
          >
            Initial recommendation
          </Link>
        </div>
        {recommendations.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Watchlist preview scores are shown below for context only — not
            final buy amounts.
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {isResume
          ? "Reviewing your updated setup..."
          : "Generating your first recommendation preview..."}
      </p>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isResume
          ? "No buy recommendations preview for this update. Your dashboard will reflect saved changes."
          : "No buy recommendations yet. You can generate a full monthly plan from the dashboard after setup."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Based on your holdings, watchlist, and strategy preferences — not target
        allocations. Amounts are a preview only; your first saved plan is created
        from the dashboard.
      </p>
      <ul className="space-y-3">
        {recommendations.map((candidate) => (
          <li
            key={candidate.symbol}
            className="rounded-lg border border-input p-4 space-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{candidate.symbol}</p>
              <p className="text-sm tabular-nums">
                Score {candidate.recommendation_score.toFixed(1)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{candidate.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
