import type { InitialInvestmentResearch } from "@/lib/validation/initial-recommendation";

type InitialResearchPreviewProps = {
  research: InitialInvestmentResearch;
};

export function InitialResearchPreview({
  research,
}: InitialResearchPreviewProps) {
  return (
    <div className="space-y-4 rounded-lg border border-input p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Parsed initial investment research</p>
        <p className="text-sm text-muted-foreground">{research.summary}</p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Report date</dt>
          <dd>{research.report_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Market regime</dt>
          <dd>{research.market_regime}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Overall risk</dt>
          <dd>{research.overall_risk_level}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Symbols</dt>
          <dd>{research.symbols.length}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-input text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Symbol</th>
              <th className="py-2 pr-3 font-medium">Role</th>
              <th className="py-2 pr-3 font-medium">Bias</th>
              <th className="py-2 pr-3 font-medium">Direction</th>
            </tr>
          </thead>
          <tbody>
            {research.symbols.map((symbol) => (
              <tr key={symbol.symbol} className="border-b border-input/60">
                <td className="py-2 pr-3 font-medium">{symbol.symbol}</td>
                <td className="py-2 pr-3">{symbol.suggested_role}</td>
                <td className="py-2 pr-3">{symbol.ai_bias}</td>
                <td className="py-2 pr-3">{symbol.recommendation_direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
