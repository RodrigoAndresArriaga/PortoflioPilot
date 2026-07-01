"use client";

import { Button } from "@/components/ui/button";

type MonthlyPlanActionsProps = {
  hasPlan: boolean;
  isCompleted: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  canMarkComplete: boolean;
  canGenerate?: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onMarkComplete: () => void;
};

export function MonthlyPlanActions({
  hasPlan,
  isCompleted,
  isGenerating,
  isSaving,
  isCompleting,
  canMarkComplete,
  canGenerate = true,
  onGenerate,
  onSave,
  onMarkComplete,
}: MonthlyPlanActionsProps) {
  if (isCompleted) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant={hasPlan ? "outline" : "default"}
        onClick={onGenerate}
        disabled={isGenerating || isSaving || isCompleting || !canGenerate}
      >
        {isGenerating
          ? "Generating..."
          : hasPlan
            ? "Regenerate plan"
            : "Generate plan"}
      </Button>
      {hasPlan ? (
        <>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || isGenerating || isCompleting}
          >
            {isSaving ? "Saving..." : "Save plan"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onMarkComplete}
            disabled={
              !canMarkComplete || isCompleting || isSaving || isGenerating
            }
          >
            {isCompleting ? "Marking complete..." : "Mark plan complete"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
