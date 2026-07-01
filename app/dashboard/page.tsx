import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireCurrentUserProfile();
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
            Portfolio input, holdings, and monthly plans arrive in the next
            milestone.
          </p>
        </div>

        {!profile.onboarding_completed ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Setup required</Badge>
              </div>
              <CardTitle>Complete your profile setup</CardTitle>
              <CardDescription>
                Finish onboarding to unlock portfolio input, target allocation,
                and monthly buy plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" disabled>
                Start setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>You&apos;re all set</CardTitle>
              <CardDescription>
                Your profile setup is complete. Portfolio tools will appear here
                in B2.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
