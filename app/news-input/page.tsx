import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { NewsInputManager } from "@/components/news-input/news-input-manager";
import { getNewsReports } from "@/lib/server/news-inputs";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function NewsInputPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const reports = (await getNewsReports({ limit: 20 })) ?? [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell profile={profile} email={user?.email} pageTitle="News input">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            News input
          </h2>
          <p className="text-muted-foreground">
            Paste ChatGPT scheduled report JSON, add a single symbol manually,
            or review saved news-risk inputs before your monthly plan.
          </p>
        </div>

        <NewsInputManager initialReports={reports} />
      </div>
    </AppShell>
  );
}
