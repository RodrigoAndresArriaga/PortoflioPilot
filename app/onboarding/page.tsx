import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getOnboardingResumeData } from "@/lib/server/onboarding";
import { requireCurrentUserProfile } from "@/lib/server/profile";

type OnboardingPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const profile = await requireCurrentUserProfile();
  const params = await searchParams;
  const isResume = params.mode === "resume";

  if (profile.onboarding_completed && !isResume) {
    redirect("/dashboard");
  }

  if (!profile.onboarding_completed && isResume) {
    redirect("/onboarding");
  }

  const resumeData = isResume ? await getOnboardingResumeData() : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PortfolioPilot
          </h1>
          <p className="text-sm text-muted-foreground">
            {isResume
              ? "Update your setup or add holdings after you invest"
              : "Complete setup to unlock your portfolio dashboard"}
          </p>
        </div>

        <OnboardingWizard
          initialBaseCurrency={profile.base_currency}
          mode={isResume ? "resume" : "setup"}
          initialFormData={resumeData?.formData}
        />
      </div>
    </div>
  );
}
