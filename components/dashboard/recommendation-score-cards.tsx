import type { RecommendationCandidate } from "@/lib/engine/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecommendationScoreCardsProps = {
  recommendations: RecommendationCandidate[];
};

export function RecommendationScoreCards({
  recommendations,
}: RecommendationScoreCardsProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendation scores</CardTitle>
          <CardDescription>
            Add holdings or watchlist symbols to see engine-ranked opportunities.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendation scores</CardTitle>
        <CardDescription>
          Top-ranked buy opportunities from the decision engine this month.
        </CardDescription>
      </CardHeader>
      <div className="divide-y divide-border px-6 pb-6">
        {recommendations.map((candidate) => (
          <div
            key={candidate.symbol}
            className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{candidate.symbol}</p>
                <Badge variant="secondary">
                  Score {candidate.recommendation_score.toFixed(1)}
                </Badge>
                {candidate.concentration_flag ? (
                  <Badge variant="destructive">Concentration</Badge>
                ) : null}
                {candidate.manual_review_required ? (
                  <Badge variant="outline">Manual review</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Technical {candidate.technical_score.toFixed(1)} · News{" "}
                {candidate.news_modifier_score.toFixed(1)} · Risk{" "}
                {candidate.risk_score.toFixed(1)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
