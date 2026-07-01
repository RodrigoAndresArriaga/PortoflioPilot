"use client";

import { useMemo, useState } from "react";

import { NewsReportPreview } from "@/components/news-input/news-report-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildMergedSymbolReport,
  formatReportTypeLabel,
  type ManualSymbolFormInput,
  validateMergedReport,
} from "@/lib/client/parse-news-json";
import { getNewsReport, saveNewsInput } from "@/lib/server/news-inputs";
import type { NewsReport, NewsReportType } from "@/lib/validation/news-input";

type NewsInputManualPanelProps = {
  onSaved: (reportKey: string) => void;
  onError: (message: string | null) => void;
};

const REPORT_TYPES: NewsReportType[] = [
  "daily_urgent_scan",
  "weekly_market_review",
  "monthly_allocation_review",
];

const ASSET_TYPES = ["etf", "stock"] as const;
const NEWS_DIRECTIONS = ["positive", "neutral", "negative", "mixed"] as const;
const IMPACT_HORIZONS = ["short_term", "medium_term", "long_term"] as const;
const EVENT_TYPES = [
  "macro",
  "earnings",
  "regulation",
  "lawsuit",
  "product",
  "sector",
  "geopolitical",
  "valuation",
  "other",
] as const;
const DAILY_AI_BIASES = ["hold", "watch", "reduce", "avoid"] as const;
const MONTHLY_AI_BIASES = ["add", "hold", "watch", "reduce", "avoid"] as const;
const RISK_LEVELS = ["low", "medium", "high"] as const;
const FRONTEND_STATUSES = [
  "normal",
  "watch",
  "reduce_new_buys",
  "manual_review",
] as const;

function createEmptyForm(): ManualSymbolFormInput {
  return {
    reportType: "monthly_allocation_review",
    reportPeriod: "",
    symbol: "",
    asset_type: "stock",
    event_type: "other",
    news_direction: "neutral",
    news_score: 50,
    news_confidence: 50,
    impact_horizon: "medium_term",
    ai_bias: "hold",
    risk_flags: [],
    one_sentence_reason: "",
    source_count: 0,
    reason: "",
    risk_level: "medium",
    suggested_frontend_status: "watch",
  };
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function NewsInputManualPanel({
  onSaved,
  onError,
}: NewsInputManualPanelProps) {
  const [form, setForm] = useState<ManualSymbolFormInput>(() =>
    createEmptyForm(),
  );
  const [previewReport, setPreviewReport] = useState<NewsReport | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const periodLabel = useMemo(() => {
    return form.reportType === "monthly_allocation_review"
      ? "Report month (YYYY-MM)"
      : "Report date (YYYY-MM-DD)";
  }, [form.reportType]);

  const periodPlaceholder =
    form.reportType === "monthly_allocation_review" ? "2026-07" : "2026-07-01";

  function patch(fields: Partial<ManualSymbolFormInput>) {
    setForm((current) => ({ ...current, ...fields }));
    setPreviewReport(null);
    setValidationError(null);
    setFieldErrors({});
  }

  async function handlePreview() {
    setValidationError(null);
    setFieldErrors({});
    onError(null);

    if (!form.symbol.trim()) {
      setValidationError("Symbol is required.");
      return;
    }

    if (!form.reportPeriod.trim()) {
      setValidationError(`${periodLabel} is required.`);
      return;
    }

    setIsPreviewing(true);
    const existing = await getNewsReport(form.reportType, form.reportPeriod);
    setIsPreviewing(false);

    const existingPayload =
      existing?.header.payload && typeof existing.header.payload === "object"
        ? (existing.header.payload as NewsReport)
        : null;

    const merged = buildMergedSymbolReport(existingPayload, form);
    const validated = validateMergedReport(merged);

    if (!validated.ok) {
      setPreviewReport(null);
      setValidationError(validated.error);
      setFieldErrors(validated.fieldErrors ?? {});
      return;
    }

    setPreviewReport(validated.data);
  }

  async function handleSave() {
    if (!previewReport) {
      return;
    }

    onError(null);
    setIsSaving(true);
    const result = await saveNewsInput(previewReport);
    setIsSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setForm(createEmptyForm());
    setPreviewReport(null);
    setValidationError(null);
    setFieldErrors({});
    onSaved(
      `${result.data.header.report_type}:${result.data.header.report_period}`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-lg border border-input p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manual-report-type">Report type</Label>
          <select
            id="manual-report-type"
            value={form.reportType}
            onChange={(event) =>
              patch({ reportType: event.target.value as NewsReportType })
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatReportTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-report-period">{periodLabel}</Label>
          <Input
            id="manual-report-period"
            value={form.reportPeriod}
            onChange={(event) => patch({ reportPeriod: event.target.value })}
            placeholder={periodPlaceholder}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="manual-symbol">Symbol</Label>
          <Input
            id="manual-symbol"
            value={form.symbol}
            onChange={(event) => patch({ symbol: event.target.value })}
            placeholder="NVDA"
          />
        </div>

        {(form.reportType === "daily_urgent_scan" ||
          form.reportType === "monthly_allocation_review") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="manual-asset-type">Asset type</Label>
              <select
                id="manual-asset-type"
                value={form.asset_type}
                onChange={(event) =>
                  patch({
                    asset_type: event.target.value as "etf" | "stock",
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-event-type">Event type</Label>
              <select
                id="manual-event-type"
                value={form.event_type}
                onChange={(event) => patch({ event_type: event.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-news-direction">News direction</Label>
              <select
                id="manual-news-direction"
                value={form.news_direction}
                onChange={(event) =>
                  patch({ news_direction: event.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {NEWS_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {formatLabel(direction)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-impact-horizon">Impact horizon</Label>
              <select
                id="manual-impact-horizon"
                value={form.impact_horizon}
                onChange={(event) =>
                  patch({ impact_horizon: event.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {IMPACT_HORIZONS.map((horizon) => (
                  <option key={horizon} value={horizon}>
                    {formatLabel(horizon)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-news-score">News score (0–100)</Label>
              <Input
                id="manual-news-score"
                type="number"
                min={0}
                max={100}
                value={form.news_score ?? 50}
                onChange={(event) =>
                  patch({ news_score: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-news-confidence">
                News confidence (0–100)
              </Label>
              <Input
                id="manual-news-confidence"
                type="number"
                min={0}
                max={100}
                value={form.news_confidence ?? 50}
                onChange={(event) =>
                  patch({ news_confidence: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-ai-bias">AI bias</Label>
              <select
                id="manual-ai-bias"
                value={form.ai_bias}
                onChange={(event) => patch({ ai_bias: event.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {(form.reportType === "daily_urgent_scan"
                  ? DAILY_AI_BIASES
                  : MONTHLY_AI_BIASES
                ).map((bias) => (
                  <option key={bias} value={bias}>
                    {formatLabel(bias)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-source-count">Source count</Label>
              <Input
                id="manual-source-count"
                type="number"
                min={0}
                value={form.source_count ?? 0}
                onChange={(event) =>
                  patch({ source_count: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="manual-reason">One sentence reason</Label>
              <Input
                id="manual-reason"
                value={form.one_sentence_reason ?? ""}
                onChange={(event) =>
                  patch({ one_sentence_reason: event.target.value })
                }
                placeholder="Brief reason for this symbol."
              />
            </div>
          </>
        )}

        {form.reportType === "weekly_market_review" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="manual-risk-level">Risk level</Label>
              <select
                id="manual-risk-level"
                value={form.risk_level}
                onChange={(event) => patch({ risk_level: event.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {formatLabel(level)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-frontend-status">
                Suggested frontend status
              </Label>
              <select
                id="manual-frontend-status"
                value={form.suggested_frontend_status}
                onChange={(event) =>
                  patch({ suggested_frontend_status: event.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {FRONTEND_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="manual-weekly-reason">Reason</Label>
              <Input
                id="manual-weekly-reason"
                value={form.reason ?? ""}
                onChange={(event) => patch({ reason: event.target.value })}
                placeholder="Why this symbol needs attention."
              />
            </div>
          </>
        )}
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {Object.keys(fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={isPreviewing}
        >
          {isPreviewing ? "Loading..." : "Validate / Preview"}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!previewReport || isSaving}
        >
          {isSaving ? "Saving..." : "Save report"}
        </Button>
      </div>

      {previewReport && <NewsReportPreview report={previewReport} />}
    </div>
  );
}
