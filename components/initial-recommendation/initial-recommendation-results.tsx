import type { MonthlyPlanWithItems } from "@/types/database";

type InitialRecommendationResultsProps = {
  plan: MonthlyPlanWithItems;
  currency: string;
};

export function InitialRecommendationResults({
  plan,
  currency,
}: InitialRecommendationResultsProps) {
  const buyItems = plan.items.filter(
    (item) => item.symbol !== "CASH" && item.recommended_amount > 0,
  );

  return (
    <div className="space-y-4 rounded-lg border border-input p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Initial manual investment recommendation
        </p>
        <p className="text-sm text-muted-foreground">
          Review before investing manually. These amounts are engine-generated
          suggestions, not automatic trades.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-input text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Symbol</th>
              <th className="py-2 pr-3 font-medium">Score</th>
              <th className="py-2 pr-3 font-medium">Suggested amount</th>
              <th className="py-2 pr-3 font-medium">Review</th>
            </tr>
          </thead>
          <tbody>
            {buyItems.map((item) => (
              <tr key={item.id} className="border-b border-input/60">
                <td className="py-2 pr-3 font-medium">{item.symbol}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {item.recommendation_score?.toFixed(1) ?? "—"}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {item.recommended_amount.toLocaleString(undefined, {
                    style: "currency",
                    currency,
                  })}
                </td>
                <td className="py-2 pr-3">
                  {item.manual_review_required ? "Manual review" : "OK"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plan.items.some((item) => item.symbol === "CASH") && (
        <p className="text-sm text-muted-foreground">
          Includes a small cash reserve line item for flexibility.
        </p>
      )}
    </div>
  );
}
