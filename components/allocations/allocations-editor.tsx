"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AllocationStep } from "@/components/onboarding/steps/allocation-step";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { upsertTargetAllocations } from "@/lib/server/targets";
import {
  formatZodErrors,
  type AllocationStepValue,
  type HoldingInput,
} from "@/lib/validation/onboarding";
import { upsertTargetAllocationsSchema } from "@/lib/validation/targets";

import { isAllocationTotalValid } from "./allocation-form-utils";

type AllocationsEditorProps = {
  initialValue: AllocationStepValue;
  riskProfile: string;
  holdings: HoldingInput[];
};

export function AllocationsEditor({
  initialValue,
  riskProfile,
  holdings,
}: AllocationsEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState<AllocationStepValue>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totalValid = isAllocationTotalValid(value);

  async function handleSave() {
    setErrors({});
    setSubmitError(null);

    const parsed = upsertTargetAllocationsSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(formatZodErrors(parsed.error));
      return;
    }

    setIsSaving(true);
    const result = await upsertTargetAllocations(parsed.data);
    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AllocationStep
        value={value}
        riskProfile={
          riskProfile as Parameters<typeof AllocationStep>[0]["riskProfile"]
        }
        holdings={holdings}
        onChange={setValue}
        errors={errors}
      />

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !totalValid}
      >
        {isSaving ? "Saving..." : "Save allocation"}
      </Button>
    </div>
  );
}
