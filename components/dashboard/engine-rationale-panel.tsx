import type { RecommendationCandidate } from "@/lib/engine/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EngineRationalePanelProps = {
  topRecommendation: RecommendationCandidate | null;
};

export function EngineRationalePanel({
  topRecommendation,
}: EngineRationalePanelProps) {
  if (!topRecommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engine rationale</CardTitle>
          <CardDescription>
            The recommendation engine will explain its top pick once candidates
            are available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine rationale</CardTitle>
        <CardDescription>
          Why {topRecommendation.symbol} ranks highly this month.
        </CardDescription>
      </CardHeader>
      <div className="space-y-3 px-6 pb-6 text-sm text-muted-foreground">
        <p>{topRecommendation.decision_basis}</p>
        <p>{topRecommendation.reason}</p>
      </div>
    </Card>
  );
}
