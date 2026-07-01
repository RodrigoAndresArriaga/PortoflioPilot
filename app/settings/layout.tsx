import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell profile={profile} email={user?.email} pageTitle="Settings">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your profile, investment strategy, watchlist,
            watchlist, and email alerts.
          </p>
        </div>

        {children}
      </div>
    </AppShell>
  );
}
