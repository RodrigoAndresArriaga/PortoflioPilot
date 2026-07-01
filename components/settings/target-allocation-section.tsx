import { AllocationsEditor } from "@/components/allocations/allocations-editor";
import type { HoldingInput } from "@/lib/validation/holdings";
import type { AllocationStepValue } from "@/lib/validation/onboarding";

import { SettingsSection } from "./settings-section";

type TargetAllocationSectionProps = {
  initialValue: AllocationStepValue;
  riskProfile: string;
  holdings: HoldingInput[];
};

export function TargetAllocationSection({
  initialValue,
  riskProfile,
  holdings,
}: TargetAllocationSectionProps) {
  return (
    <SettingsSection
      id="target-allocation"
      title="Target allocation"
      description="Set how new monthly investments should be distributed across buckets and symbols."
    >
      <AllocationsEditor
        initialValue={initialValue}
        riskProfile={riskProfile}
        holdings={holdings}
      />
    </SettingsSection>
  );
}
