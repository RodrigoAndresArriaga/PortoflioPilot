"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import { isQuoteStale } from "@/lib/market-data/quote-utils";
import { updateHolding } from "@/lib/server/holdings";
import type { AssetType } from "@/types/database";

type HoldingValueDisplayProps = {
  holdingId: string;
  assetType: AssetType;
  currentValue: number;
  currency: string;
  shares: number | null;
  lastPrice: number | null;
  lastPriceAt: string | null;
  onUpdated: () => void;
};

function formatAsOf(timestamp: string | null): string | null {
  if (!timestamp) {
    return null;
  }
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HoldingValueDisplay({
  holdingId,
  assetType,
  currentValue,
  currency,
  shares,
  lastPrice,
  lastPriceAt,
  onUpdated,
}: HoldingValueDisplayProps) {
  const usesMarketQuote = isQuotedMarketAsset(assetType);
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stale = usesMarketQuote && isQuoteStale(lastPriceAt);
  const asOf = formatAsOf(lastPriceAt);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const result = await updateHolding({
      id: holdingId,
      current_value: value,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setIsEditing(false);
    onUpdated();
  }

  function handleCancel() {
    setValue(currentValue);
    setError(null);
    setIsEditing(false);
  }

  if (usesMarketQuote) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {currentValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
          {stale && <Badge variant="outline">Stale quote</Badge>}
        </div>
        {lastPrice != null && shares != null && shares > 0 && (
          <p className="text-xs text-muted-foreground">
            {shares.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            shares ×{" "}
            {lastPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        )}
        {asOf && (
          <p className="text-xs text-muted-foreground">As of {asOf}</p>
        )}
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {currentValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {currency}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(event) => setValue(event.target.valueAsNumber || 0)}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground">{currency}</span>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
