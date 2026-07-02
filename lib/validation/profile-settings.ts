import { z } from "zod";

import {
  baseCurrencySchema,
  riskProfileSchema,
  timeHorizonSchema,
} from "@/lib/validation/common";

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().max(100).nullable(),
  base_currency: baseCurrencySchema,
  monthly_investment_amount: z.coerce
    .number()
    .min(0, "Monthly amount must be zero or greater"),
  initial_investment_amount: z.coerce
    .number()
    .min(0, "Initial amount must be zero or greater")
    .nullable()
    .optional(),
  investment_day: z.coerce
    .number()
    .int()
    .min(1, "Day must be between 1 and 31")
    .max(31, "Day must be between 1 and 31"),
  risk_profile: riskProfileSchema,
  time_horizon: timeHorizonSchema,
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
