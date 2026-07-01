"use client";

import { useState } from "react";

import { NewsReportPreview } from "@/components/news-input/news-report-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseNewsJson } from "@/lib/client/parse-news-json";
import { saveNewsInput } from "@/lib/server/news-inputs";
import type { NewsReport } from "@/lib/validation/news-input";

type NewsInputPastePanelProps = {
  onSaved: (reportKey: string) => void;
  onError: (message: string | null) => void;
};

export function NewsInputPastePanel({
  onSaved,
  onError,
}: NewsInputPastePanelProps) {
  const [rawJson, setRawJson] = useState("");
  const [previewReport, setPreviewReport] = useState<NewsReport | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handlePreview() {
    setParseError(null);
    setFieldErrors({});
    onError(null);

    const result = parseNewsJson(rawJson);
    if (!result.ok) {
      setPreviewReport(null);
      setParseError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setPreviewReport(result.data);
  }

  async function handleSave() {
    if (!previewReport) {
      return;
    }

    onError(null);
    setIsSaving(true);
    const result = await saveNewsInput(rawJson);
    setIsSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setRawJson("");
    setPreviewReport(null);
    setParseError(null);
    setFieldErrors({});
    onSaved(
      `${result.data.header.report_type}:${result.data.header.report_period}`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="news-json-input">ChatGPT report JSON</Label>
        <textarea
          id="news-json-input"
          value={rawJson}
          onChange={(event) => {
            setRawJson(event.target.value);
            setPreviewReport(null);
            setParseError(null);
            setFieldErrors({});
          }}
          placeholder='Paste a daily_urgent_scan, weekly_market_review, or monthly_allocation_review JSON object.'
          className="min-h-56 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {parseError && (
        <Alert variant="destructive">
          <AlertDescription>{parseError}</AlertDescription>
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
        <Button type="button" variant="secondary" onClick={handlePreview}>
          Validate / Preview
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
