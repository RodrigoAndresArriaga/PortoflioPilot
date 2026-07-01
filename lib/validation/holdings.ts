import { z } from "zod";

import { assetTypeSchema, baseCurrencySchema } from "@/lib/validation/common";

export const holdingInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: assetTypeSchema,
  currency: baseCurrencySchema,
  current_value: z.coerce
    .number()
    .min(0, "Current value must be zero or greater"),
  cost_basis: z.coerce
    .number()
    .min(0, "Cost basis must be zero or greater")
    .optional()
    .nullable(),
  shares: z.coerce.number().min(0).optional().nullable(),
  broker: z.string().trim().max(100).optional().nullable(),
});

export const createHoldingSchema = holdingInputSchema;

export const updateHoldingSchema = z
  .object({
    id: z.string().uuid("Invalid holding id"),
    symbol: z
      .string()
      .trim()
      .min(1, "Symbol is required")
      .max(20, "Symbol is too long")
      .optional(),
    asset_name: z.string().trim().max(100).optional().nullable(),
    asset_type: assetTypeSchema.optional(),
    currency: baseCurrencySchema.optional(),
    current_value: z.coerce
      .number()
      .min(0, "Current value must be zero or greater")
      .optional(),
    cost_basis: z.coerce
      .number()
      .min(0, "Cost basis must be zero or greater")
      .optional()
      .nullable(),
    shares: z.coerce.number().min(0).optional().nullable(),
    broker: z.string().trim().max(100).optional().nullable(),
  })
  .refine(
    (data) =>
      data.symbol !== undefined ||
      data.asset_name !== undefined ||
      data.asset_type !== undefined ||
      data.currency !== undefined ||
      data.current_value !== undefined ||
      data.cost_basis !== undefined ||
      data.shares !== undefined ||
      data.broker !== undefined,
    { message: "At least one field must be provided for update" },
  );

export const holdingsListSchema = z
  .object({
    holdings: z.array(holdingInputSchema).min(1, "Add at least one holding"),
  })
  .superRefine((data, ctx) => {
    const symbols = data.holdings.map((h) => h.symbol.trim().toUpperCase());
    const unique = new Set(symbols);
    if (unique.size !== symbols.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate symbols are not allowed",
        path: ["holdings"],
      });
    }
  });

export type HoldingInput = z.infer<typeof holdingInputSchema>;
export type CreateHoldingInput = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;
export type HoldingsListInput = z.infer<typeof holdingsListSchema>;
