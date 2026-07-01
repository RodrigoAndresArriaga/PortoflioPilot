import { requireCurrentUserProfile } from "@/lib/server/profile";

import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const profile = await requireCurrentUserProfile();

  return (
    <div className="flex flex-1 flex-col bg-background px-6 py-16">
      <main className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Dashboard
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="text-muted-foreground">
              Your profile is ready. Holdings and portfolio tools come in later
              milestones.
            </p>
          </div>
          <SignOutButton />
        </div>

        <section className="rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Profile
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs text-foreground">{profile.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Base currency</dt>
              <dd className="text-foreground">{profile.base_currency}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Risk profile</dt>
              <dd className="text-foreground">{profile.risk_profile}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Time horizon</dt>
              <dd className="text-foreground">{profile.time_horizon}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Monthly investment</dt>
              <dd className="text-foreground">
                {profile.monthly_investment_amount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Onboarding completed</dt>
              <dd className="text-foreground">
                {profile.onboarding_completed ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
