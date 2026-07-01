import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countReportSymbols,
  formatReportTypeLabel,
  getReportPeriodFromReport,
} from "@/lib/client/parse-news-json";
import type { NewsReport } from "@/lib/validation/news-input";

type NewsReportPreviewProps = {
  report: NewsReport;
};

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function NewsReportPreview({ report }: NewsReportPreviewProps) {
  const symbolCount = countReportSymbols(report);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {formatReportTypeLabel(report.report_type)}
          </CardTitle>
          <CardDescription>
            Period: {getReportPeriodFromReport(report)} · {symbolCount} symbol
            {symbolCount === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.report_type === "daily_urgent_scan" && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={report.urgent_news ? "destructive" : "secondary"}>
                  {report.urgent_news ? "Urgent news" : "No urgent news"}
                </Badge>
              </div>
              {!report.urgent_news && (
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              )}
              {report.urgent_news && (
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Risk level: </span>
                    {formatLabel(report.overall_risk_level)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Regime: </span>
                    {formatLabel(report.market_regime)}
                  </div>
                </div>
              )}
            </>
          )}

          {report.report_type === "weekly_market_review" && (
            <>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Risk level: </span>
                  {formatLabel(report.overall_risk_level)}
                </div>
                <div>
                  <span className="text-muted-foreground">Regime: </span>
                  {formatLabel(report.market_regime)}
                </div>
                <div>
                  <span className="text-muted-foreground">Next week bias: </span>
                  {formatLabel(report.next_week_bias)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.weekly_summary}
              </p>
            </>
          )}

          {report.report_type === "monthly_allocation_review" && (
            <>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Risk level: </span>
                  {formatLabel(report.overall_risk_level)}
                </div>
                <div>
                  <span className="text-muted-foreground">Regime: </span>
                  {formatLabel(report.market_regime)}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Allocation bias:{" "}
                  </span>
                  {formatLabel(report.allocation_bias)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.monthly_summary}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {report.report_type === "daily_urgent_scan" && report.urgent_news && (
        <SymbolTable
          title="Events"
          columns={[
            "Symbol",
            "Direction",
            "Score",
            "Bias",
            "Reason",
          ]}
          rows={report.events.map((event) => [
            event.symbol,
            formatLabel(event.news_direction),
            String(event.news_score),
            formatLabel(event.ai_bias),
            event.one_sentence_reason,
          ])}
        />
      )}

      {report.report_type === "weekly_market_review" &&
        report.symbols_to_watch.length > 0 && (
          <SymbolTable
            title="Symbols to watch"
            columns={["Symbol", "Risk", "Status", "Reason"]}
            rows={report.symbols_to_watch.map((item) => [
              item.symbol,
              formatLabel(item.risk_level),
              formatLabel(item.suggested_frontend_status),
              item.reason,
            ])}
          />
        )}

      {report.report_type === "monthly_allocation_review" && (
        <SymbolTable
          title="Symbols"
          columns={[
            "Symbol",
            "Direction",
            "Score",
            "Bias",
            "Reason",
          ]}
          rows={report.symbols.map((item) => [
            item.symbol,
            formatLabel(item.news_direction),
            String(item.news_score),
            formatLabel(item.ai_bias),
            item.one_sentence_reason,
          ])}
        />
      )}
    </div>
  );
}

type SymbolTableProps = {
  title: string;
  columns: string[];
  rows: string[][];
};

function SymbolTable({ title, columns, rows }: SymbolTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2 py-2 font-medium text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border/60">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-2 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
