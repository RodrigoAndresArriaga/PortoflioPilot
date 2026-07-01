import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsNav } from "@/components/settings/settings-nav";
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
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h2>
          <p className="text-muted-foreground">
            Update your target allocation and watchlist preferences.
          </p>
        </div>

        <SettingsNav />

        {children}
      </div>
    </AppShell>
  );
}
