import { z } from "zod";

import {
  watchlistAssetTypeSchema,
  watchlistBucketSchema,
} from "@/lib/validation/common";

export const watchlistItemInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: watchlistAssetTypeSchema.optional().nullable(),
  bucket: watchlistBucketSchema.optional().nullable(),
  sort_order: z.number().int().min(0),
});

export const upsertWatchlistSchema = z.object({
  watchlist: z
    .array(watchlistItemInputSchema)
    .min(1, "Select at least one watchlist symbol"),
});

export type WatchlistItemInput = z.infer<typeof watchlistItemInputSchema>;
export type UpsertWatchlistInput = z.infer<typeof upsertWatchlistSchema>;
