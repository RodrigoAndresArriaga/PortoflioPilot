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
};

export type AllocationEngineOutput = AllocationAssetResult[];
