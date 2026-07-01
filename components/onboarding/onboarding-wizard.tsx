"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CurrencyStep } from "@/components/onboarding/steps/currency-step";
import { HoldingsStep } from "@/components/onboarding/steps/holdings-step";
import { InvestmentStatusStep } from "@/components/onboarding/steps/investment-status-step";
import { InvestorProfileStep } from "@/components/onboarding/steps/investor-profile-step";
import { RecommendationPreviewStep } from "@/components/onboarding/steps/recommendation-preview-step";
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
import {
  completeOnboarding,
  resumeOnboardingUpdate,
} from "@/lib/server/onboarding";
import {
  currencyStepSchema,
  formatZodErrors,
  getDefaultOnboardingFormData,
  holdingsStepSchema,
  investmentStatusStepSchema,
  investorProfileStepSchema,
  mergeHoldingsIntoWatchlist,
  optionalHoldingsStepSchema,
  type OnboardingFormData,
  watchlistStepSchema,
} from "@/lib/validation/onboarding";

type OnboardingWizardProps = {
  initialBaseCurrency?: string;
  mode?: "setup" | "resume";
  initialFormData?: OnboardingFormData;
};

const TOTAL_STEPS = 7;

export function OnboardingWizard({
  initialBaseCurrency = "MXN",
  mode = "setup",
  initialFormData,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(mode === "resume" ? 1 : 0);
  const [formData, setFormData] = useState<OnboardingFormData>(
    () => initialFormData ?? getDefaultOnboardingFormData(initialBaseCurrency),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isResume = mode === "resume";
  const holdingsOptional = formData.investment_status === "not_invested_yet";

  const stepLabel = useMemo(() => {
    if (step === 0) {
      return "Welcome";
    }
    if (step === 6) {
      return isResume ? "Review changes" : "First recommendation preview";
    }
    return `Step ${step} of ${TOTAL_STEPS - 1}`;
  }, [isResume, step]);

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
        initial_investment_amount: formData.initial_investment_amount,
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
      updateFormData(result.data);
      return true;
    }

    if (step === 3) {
      const result = investmentStatusStepSchema.safeParse({
        investment_status: formData.investment_status,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }
      updateFormData(result.data);
      return true;
    }

    if (step === 4) {
      const holdingsWithCurrency = formData.holdings.map((holding) => ({
        ...holding,
        currency: formData.base_currency,
      }));
      const schema = holdingsOptional
        ? optionalHoldingsStepSchema
        : holdingsStepSchema;
      const result = schema.safeParse({
        holdings: holdingsWithCurrency,
      });
      if (!result.success) {
        setErrors(formatZodErrors(result.error));
        return false;
      }
      updateFormData({
        holdings: result.data.holdings,
        watchlist: mergeHoldingsIntoWatchlist(
          formData.watchlist,
          result.data.holdings,
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

    if (step === 6) {
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
    setStep((current) => Math.max(current - 1, isResume ? 1 : 0));
  }

  function handleSkipHoldings() {
    if (!holdingsOptional) {
      return;
    }
    updateFormData({ holdings: [] });
    setErrors({});
    setStep(5);
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

      const result = isResume
        ? await resumeOnboardingUpdate(payload)
        : await completeOnboarding(payload);

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
        <CardTitle>{isResume ? "Update setup" : "Profile setup"}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && <WelcomeStep onContinue={handleNext} />}

        {step === 1 && (
          <CurrencyStep
            value={{
              base_currency: formData.base_currency,
              monthly_investment_amount: formData.monthly_investment_amount,
              investment_day: formData.investment_day,
              initial_investment_amount: formData.initial_investment_amount,
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
          <InvestmentStatusStep
            value={{ investment_status: formData.investment_status }}
            onChange={(value) => updateFormData(value)}
            errors={errors}
          />
        )}

        {step === 4 && (
          <HoldingsStep
            value={formData.holdings}
            baseCurrency={formData.base_currency}
            onChange={(holdings) => updateFormData({ holdings })}
            errors={errors}
            optional={holdingsOptional}
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

        {step === 6 && (
          <RecommendationPreviewStep
            formData={formData}
            isResume={isResume}
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
            disabled={loading || step === (isResume ? 1 : 1)}
          >
            Back
          </Button>

          <div className="flex gap-2">
            {step === 4 && holdingsOptional && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipHoldings}
                disabled={loading}
              >
                Skip for now
              </Button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button type="button" onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={loading}>
                {loading
                  ? "Saving..."
                  : isResume
                    ? "Save changes"
                    : "Complete setup"}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
