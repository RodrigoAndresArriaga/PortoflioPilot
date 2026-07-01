export type EngineHolding = {
  symbol: string;
  current_value: number;
};

export type EngineTargetAllocation = {
  symbol: string;
  target_weight: number;
};

export type AllocationEngineInput = {
  holdings: EngineHolding[];
  target_allocations: EngineTargetAllocation[];
  monthly_investment_amount: number;
};

export type AllocationStatus = "underweight" | "on_target" | "overweight";

export type DriftStatus = "normal" | "prioritize" | "stop_buying";

export type ActionStatus = "normal" | "prioritize" | "stop_buying";

export type AllocationAssetResult = {
  symbol: string;
  current_value: number;
  current_weight: number;
  target_weight: number;
  target_value: number;
  allocation_gap: number;
  recommended_buy: number;
  status: AllocationStatus;
  reason: string;
  drift_percent: number;
  drift_status: DriftStatus;
  priority: number | null;
  action_status: ActionStatus;
};

export type AllocationEngineOutput = AllocationAssetResult[];
