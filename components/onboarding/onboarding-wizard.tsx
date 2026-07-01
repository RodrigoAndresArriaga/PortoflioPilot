"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AllocationStep } from "@/components/onboarding/steps/allocation-step";
import { CurrencyStep } from "@/components/onboarding/steps/currency-step";
import { HoldingsStep } from "@/components/onboarding/steps/holdings-step";
import { InvestorProfileStep } from "@/components/onboarding/steps/investor-profile-step";
import { WatchlistStep } from "@/components/onboarding/steps/watchlist-step";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { completeOnboarding } from "@/lib/server/onboarding";
import {
  allocationStepSchema,
  currencyStepSchema,
  formatZodErrors,
  getDefaultAllocationStepValue,
  getDefaultOnboardingFormData,
  getRecommendedBucketsForRisk,
  holdingsStepSchema,
  investorProfileStepSchema,
  mergeHoldingsIntoWatchlist,
  type OnboardingFormData,
  watchlistStepSchema,
} from "@/lib/validation/onboarding";

type OnboardingWizardProps = {
  initialBaseCurrency?: string;
};

const TOTAL_STEPS = 6;

export function OnboardingWizard({
  initialBaseCurrency = "MXN",
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(() =>
    getDefaultOnboardingFormData(initialBaseCurrency),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepLabel = useMemo(() => {
    if (step === 0) {
      return "Welcome";
    }
    return `Step ${step} of ${TOTAL_STEPS - 1}`;
  }, [step]);

  function updateFormData(patch: Partial<OnboardingFormData>) {
    setFormData((current) => ({ ...current, ...patch }));
  }

  function validateCurrentStep(): boolean {
    setErrors({});
    setSubmitError(null);

    if (step === 0) {
      return true;
    }

    if (step === 1) {
      const result = currencyStepSchema.safeParse({
        base_currency: formData.base_currency,
        monthly_investment_amount: formData.monthly_investment_amount,
        investment_day: formData.investment_day,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }
      updateFormData(result.data);
      return true;
    }

    if (step === 2) {
      const result = investorProfileStepSchema.safeParse({
        risk_profile: formData.risk_profile,
        time_horizon: formData.time_horizon,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }

      const allocationDefaults = getDefaultAllocationStepValue(
        result.data.risk_profile,
      );
      updateFormData({
        ...result.data,
        allocation_mode: allocationDefaults.allocation_mode,
        target_buckets: allocationDefaults.target_buckets,
        target_assets: allocationDefaults.target_assets,
        include_individual_stock_bucket:
          allocationDefaults.include_individual_stock_bucket,
      });
      return true;
    }

    if (step === 3) {
      const holdingsWithCurrency = formData.holdings.map((holding) => ({
        ...holding,
        currency: formData.base_currency,
      }));
      const result = holdingsStepSchema.safeParse({
        holdings: holdingsWithCurrency,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }

      updateFormData({
        holdings: result.data.holdings,
        target_buckets:
          formData.target_buckets.length > 0
            ? formData.target_buckets
            : getRecommendedBucketsForRisk(
                formData.risk_profile,
                formData.include_individual_stock_bucket,
              ),
      });
      return true;
    }

    if (step === 4) {
      const result = allocationStepSchema.safeParse({
        allocation_mode: formData.allocation_mode,
        target_buckets: formData.target_buckets,
        target_assets: formData.target_assets,
        include_individual_stock_bucket:
          formData.include_individual_stock_bucket,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }
      updateFormData({
        ...result.data,
        watchlist: mergeHoldingsIntoWatchlist(
          formData.watchlist,
          formData.holdings,
        ),
      });
      return true;
    }

    if (step === 5) {
      const result = watchlistStepSchema.safeParse({
        watchlist: formData.watchlist,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }
      updateFormData(result.data);
      return true;
    }

    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setErrors({});
    setSubmitError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleComplete() {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const payload: OnboardingFormData = {
        ...formData,
        holdings: formData.holdings.map((holding) => ({
          ...holding,
          currency: formData.base_currency,
        })),
      };

      const result = await completeOnboarding(payload);

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardDescription>{stepLabel}</CardDescription>
        <CardTitle>Profile setup</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && <WelcomeStep onContinue={handleNext} />}

        {step === 1 && (
          <CurrencyStep
            value={{
              base_currency: formData.base_currency,
              monthly_investment_amount: formData.monthly_investment_amount,
              investment_day: formData.investment_day,
            }}
            onChange={(value) => updateFormData(value)}
            errors={errors}
          />
        )}

        {step === 2 && (
          <InvestorProfileStep
            value={{
              risk_profile: formData.risk_profile,
              time_horizon: formData.time_horizon,
            }}
            onChange={(value) => updateFormData(value)}
            errors={errors}
          />
        )}

        {step === 3 && (
          <HoldingsStep
            value={formData.holdings}
            baseCurrency={formData.base_currency}
            onChange={(holdings) => updateFormData({ holdings })}
            errors={errors}
          />
        )}

        {step === 4 && (
          <AllocationStep
            value={{
              allocation_mode: formData.allocation_mode,
              target_buckets: formData.target_buckets,
              target_assets: formData.target_assets,
              include_individual_stock_bucket:
                formData.include_individual_stock_bucket,
            }}
            riskProfile={formData.risk_profile}
            holdings={formData.holdings}
            onChange={(allocation) => updateFormData(allocation)}
            errors={errors}
          />
        )}

        {step === 5 && (
          <WatchlistStep
            value={formData.watchlist}
            holdings={formData.holdings}
            onChange={(watchlist) => updateFormData({ watchlist })}
            errors={errors}
          />
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {step > 0 && (
        <CardFooter className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={loading || step === 1}
          >
            Back
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={handleNext} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={handleComplete} disabled={loading}>
              {loading ? "Saving..." : "Complete setup"}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
