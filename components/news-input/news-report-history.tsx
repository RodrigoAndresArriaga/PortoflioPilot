"use client";

import { useEffect, useMemo, useState } from "react";

import { NewsReportPreview } from "@/components/news-input/news-report-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  countReportSymbols,
  formatReportTypeLabel,
} from "@/lib/client/parse-news-json";
import type { NewsReportWithChildren } from "@/lib/server/news-inputs";
import type { NewsReport, NewsReportType } from "@/lib/validation/news-input";

type NewsReportHistoryProps = {
  reports: NewsReportWithChildren[];
  highlightKey?: string | null;
};

const ALL_TYPES = "all" as const;

function reportKey(report: NewsReportWithChildren): string {
  return `${report.header.report_type}:${report.header.report_period}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NewsReportHistory({
  reports,
  highlightKey = null,
}: NewsReportHistoryProps) {
  const [filterType, setFilterType] = useState<NewsReportType | typeof ALL_TYPES>(
    ALL_TYPES,
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(
    highlightKey ?? null,
  );

  useEffect(() => {
    if (highlightKey) {
      setExpandedKey(highlightKey);
    }
  }, [highlightKey]);

  const filteredReports = useMemo(() => {
    if (filterType === ALL_TYPES) {
      return reports;
    }
    return reports.filter((report) => report.header.report_type === filterType);
  }, [filterType, reports]);

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No saved reports yet</CardTitle>
          <CardDescription>
            Paste a ChatGPT report or add a manual symbol entry to build your
            news-risk history.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="history-filter">Filter by report type</Label>
        <select
          id="history-filter"
          value={filterType}
          onChange={(event) =>
            setFilterType(
              event.target.value as NewsReportType | typeof ALL_TYPES,
            )
          }
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value={ALL_TYPES}>All types</option>
          <option value="daily_urgent_scan">Daily urgent scan</option>
          <option value="weekly_market_review">Weekly market review</option>
          <option value="monthly_allocation_review">
            Monthly allocation review
          </option>
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No reports match this filter.
          </CardContent>
        </Card>
      ) : (
        filteredReports.map((report) => {
          const key = reportKey(report);
          const payload = report.header.payload as NewsReport | null;
          const symbolCount = payload ? countReportSymbols(payload) : report.children.length;
          const isExpanded = expandedKey === key;
          const isHighlighted = highlightKey === key;

          return (
            <Card
              key={key}
              className={isHighlighted ? "border-primary" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {formatReportTypeLabel(report.header.report_type)}
                    </CardTitle>
                    <CardDescription>
                      Period {report.header.report_period} · Saved{" "}
                      {formatDate(report.header.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {symbolCount} symbol{symbolCount === 1 ? "" : "s"}
                    </Badge>
                    {isHighlighted && <Badge>Just saved</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpandedKey(isExpanded ? null : key)
                  }
                >
                  {isExpanded ? "Hide preview" : "Show preview"}
                </Button>

                {isExpanded && payload && (
                  <NewsReportPreview report={payload} />
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
