import type { MonthlyPlanReadiness } from "@/lib/portfolio-lifecycle";

import { Alert, AlertDescription } from "@/components/ui/alert";

type MonthlyPlanReadinessAlertProps = {
  readiness: MonthlyPlanReadiness;
};

export function MonthlyPlanReadinessAlert({
  readiness,
}: MonthlyPlanReadinessAlertProps) {
  if (readiness.hasWeeklyNews) {
    return (
      <Alert>
        <AlertDescription>
          Weekly news context is available for this plan. Generation uses your
          saved weekly market review when present.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertDescription>
        No weekly news report is saved yet. Generation will proceed with neutral
        news defaults — you do not need to paste news before creating your plan.
      </AlertDescription>
    </Alert>
  );
}
