import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
            Your portfolio setup is complete. Review this month&apos;s recommended
            buys on the monthly plan page.
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
              watchlist are saved.
            </CardDescription>
            <Link href="/monthly-plan" className={cn(buttonVariants(), "mt-4")}>
              View monthly plan
            </Link>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}
