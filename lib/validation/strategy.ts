import { z } from "zod";

import {
  riskProfileSchema,
  timeHorizonSchema,
} from "@/lib/validation/common";

export const strategyPreferencesSchema = z.object({
  risk_profile: riskProfileSchema,
  time_horizon: timeHorizonSchema,
  broad_etf_priority: z.boolean(),
  cash_reserve_percent: z.coerce
    .number()
    .min(0, "Cash reserve must be between 0 and 50")
    .max(50, "Cash reserve must be between 0 and 50"),
  max_individual_stock_percent: z.coerce
    .number()
    .min(5, "Max stock exposure must be between 5 and 40")
    .max(40, "Max stock exposure must be between 5 and 40"),
});

export type StrategyPreferencesInput = z.infer<
  typeof strategyPreferencesSchema
>;
