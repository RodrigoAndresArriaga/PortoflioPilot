import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireCurrentUserProfile } from "@/lib/server/profile";

export default async function OnboardingPage() {
  const profile = await requireCurrentUserProfile();

  if (profile.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PortfolioPilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete setup to unlock your portfolio dashboard
          </p>
        </div>

        <OnboardingWizard initialBaseCurrency={profile.base_currency} />
      </div>
    </div>
  );
}
