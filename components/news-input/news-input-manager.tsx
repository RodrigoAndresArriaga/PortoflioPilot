"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NewsInputManualPanel } from "@/components/news-input/news-input-manual-panel";
import { NewsInputPastePanel } from "@/components/news-input/news-input-paste-panel";
import { NewsReportHistory } from "@/components/news-input/news-report-history";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { NewsReportWithChildren } from "@/lib/server/news-inputs";

type NewsInputMode = "paste" | "manual" | "history";

type NewsInputManagerProps = {
  initialReports: NewsReportWithChildren[];
};

const MODES: { id: NewsInputMode; label: string }[] = [
  { id: "paste", label: "Paste report" },
  { id: "manual", label: "Manual symbol" },
  { id: "history", label: "History" },
];

export function NewsInputManager({ initialReports }: NewsInputManagerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<NewsInputMode>("paste");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  useEffect(() => {
    setHighlightKey(null);
  }, [initialReports]);

  function refresh() {
    router.refresh();
  }

  function handleSaved(reportKey: string) {
    setFormError(null);
    setSuccessMessage("Report saved successfully.");
    setHighlightKey(reportKey);
    setMode("history");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={mode === item.id ? "default" : "outline"}
            onClick={() => {
              setMode(item.id);
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {mode === "paste" && (
        <NewsInputPastePanel onSaved={handleSaved} onError={setFormError} />
      )}

      {mode === "manual" && (
        <NewsInputManualPanel onSaved={handleSaved} onError={setFormError} />
      )}

      {mode === "history" && (
        <NewsReportHistory
          reports={initialReports}
          highlightKey={highlightKey}
        />
      )}
    </div>
  );
}
