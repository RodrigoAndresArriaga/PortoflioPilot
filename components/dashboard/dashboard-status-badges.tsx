import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RISK_PROFILE_LABELS: Record<string, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  growth: "Growth",
  aggressive_growth: "Aggressive growth",
};

type DashboardStatusBadgesProps = {
  riskProfile: string;
};

export function DashboardStatusBadges({
  riskProfile,
}: DashboardStatusBadgesProps) {
  const riskLabel = RISK_PROFILE_LABELS[riskProfile] ?? riskProfile;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Current risk level</CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <CardTitle className="text-lg">{riskLabel}</CardTitle>
            <Badge variant="secondary">Profile only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Based on your saved risk profile. Technical scoring will be available
            after E4.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>News-risk status</CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <CardTitle className="text-lg">Not configured</CardTitle>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manual news-risk inputs are not set up yet. This will be available in
            a future milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
