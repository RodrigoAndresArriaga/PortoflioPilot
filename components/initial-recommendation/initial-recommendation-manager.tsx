"use client";

import { useState } from "react";

import { InitialRecommendationResults } from "@/components/initial-recommendation/initial-recommendation-results";
import { InitialResearchPreview } from "@/components/initial-recommendation/initial-research-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseInitialResearchJsonClient } from "@/lib/client/parse-initial-research-json";
import { saveInitialResearchAndGenerate } from "@/lib/server/initial-recommendations";
import type { InitialInvestmentResearch } from "@/lib/validation/initial-recommendation";
import type { MonthlyPlanWithItems } from "@/types/database";

type InitialRecommendationManagerProps = {
  currency: string;
  initialPlan: MonthlyPlanWithItems | null;
};

export function InitialRecommendationManager({
  currency,
  initialPlan,
}: InitialRecommendationManagerProps) {
  const [rawJson, setRawJson] = useState("");
  const [previewResearch, setPreviewResearch] =
    useState<InitialInvestmentResearch | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlan, setSavedPlan] = useState<MonthlyPlanWithItems | null>(
    initialPlan,
  );

  function handlePreview() {
    setParseError(null);
    setFieldErrors({});
    setSaveError(null);

    const result = parseInitialResearchJsonClient(rawJson);
    if (!result.ok) {
      setPreviewResearch(null);
      setParseError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setPreviewResearch(result.data);
  }

  async function handleSave() {
    if (!previewResearch) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    const result = await saveInitialResearchAndGenerate(rawJson);
    setIsSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }

    setRawJson("");
    setPreviewResearch(null);
    setParseError(null);
    setFieldErrors({});
    setSavedPlan(result.data.plan);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="initial-research-json">
            Initial investment research JSON
          </Label>
          <textarea
            id="initial-research-json"
            value={rawJson}
            onChange={(event) => {
              setRawJson(event.target.value);
              setPreviewResearch(null);
              setParseError(null);
              setFieldErrors({});
            }}
            placeholder='Paste the initial_investment_research JSON from ChatGPT.'
            className="min-h-56 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {parseError && (
          <Alert variant="destructive">
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
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
            disabled={!previewResearch || isSaving}
          >
            {isSaving ? "Generating..." : "Save and generate recommendation"}
          </Button>
        </div>

        {previewResearch && (
          <InitialResearchPreview research={previewResearch} />
        )}
      </div>

      {savedPlan && (
        <InitialRecommendationResults plan={savedPlan} currency={currency} />
      )}
    </div>
  );
}
