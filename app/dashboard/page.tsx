import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell profile={profile} email={user?.email}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
          </h2>
          <p className="text-muted-foreground">
            Your portfolio setup is complete. Monthly buy plans arrive in B3.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Setup complete</Badge>
            </div>
            <CardTitle>You&apos;re all set</CardTitle>
            <CardDescription>
              Your profile, portfolio, holdings, target allocation, and
              watchlist are saved. Monthly buy plans arrive in B3.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}
