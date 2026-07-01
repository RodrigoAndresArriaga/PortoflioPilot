import { z } from "zod";

import { baseCurrencySchema } from "@/lib/validation/common";

export const monthKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format");

export const monthlyPlanStatusSchema = z.enum([
  "draft",
  "confirmed",
  "completed",
]);

export const monthlyPlanItemInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  recommendation_score: z.coerce.number().min(0).max(100).nullable().optional(),
  technical_score: z.coerce.number().min(0).max(100).nullable().optional(),
  news_modifier_score: z.coerce.number().min(0).max(100).nullable().optional(),
  risk_score: z.coerce.number().min(0).max(100).nullable().optional(),
  concentration_flag: z.boolean().optional().default(false),
  manual_review_required: z.boolean().optional().default(false),
  decision_basis: z.string().trim().max(500).nullable().optional(),
  recommended_amount: z.coerce
    .number()
    .min(0, "Recommended amount must be zero or greater"),
  adjusted_amount: z.coerce
    .number()
    .min(0, "Adjusted amount must be zero or greater"),
  reason: z.string().trim().min(1, "Reason is required").max(500),
});

export const saveMonthlyPlanSchema = z
  .object({
    month: monthKeySchema,
    monthly_amount: z.coerce
      .number()
      .min(0, "Monthly amount must be zero or greater"),
    currency: baseCurrencySchema,
    status: monthlyPlanStatusSchema.default("draft"),
    items: z
      .array(monthlyPlanItemInputSchema)
      .min(1, "Add at least one plan item"),
  })
  .superRefine((data, ctx) => {
    const symbols = data.items.map((item) => item.symbol.trim().toUpperCase());
    const unique = new Set(symbols);
    if (unique.size !== symbols.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate symbols are not allowed in plan items",
        path: ["items"],
      });
    }
  });

export const getMonthlyPlanSchema = z.object({
  month: monthKeySchema,
});

export const markMonthlyPlanCompletedSchema = z.object({
  plan_id: z.string().uuid("Invalid plan id"),
});

export type MonthlyPlanItemInput = z.infer<typeof monthlyPlanItemInputSchema>;
export type SaveMonthlyPlanInput = z.infer<typeof saveMonthlyPlanSchema>;
export type GetMonthlyPlanInput = z.infer<typeof getMonthlyPlanSchema>;
export type MarkMonthlyPlanCompletedInput = z.infer<
  typeof markMonthlyPlanCompletedSchema
>;
