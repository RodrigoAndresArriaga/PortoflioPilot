"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import type { CreateHoldingInput, HoldingInput } from "@/lib/validation/holdings";

const ASSET_TYPES = ["etf", "stock", "cash", "crypto", "other"] as const;

type HoldingFormProps = {
  value: HoldingInput;
  baseCurrency: string;
  onChange: (value: HoldingInput) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  idPrefix?: string;
};

export function createEmptyHolding(currency: string): CreateHoldingInput {
  return {
    symbol: "",
    asset_name: null,
    asset_type: "etf",
    currency: currency as CreateHoldingInput["currency"],
    shares: null,
    cost_basis: null,
    broker: null,
  };
}

export function HoldingForm({
  value,
  baseCurrency,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting = false,
  errors,
  idPrefix = "holding",
}: HoldingFormProps) {
  const usesMarketQuote = isQuotedMarketAsset(value.asset_type);

  function patch(fields: Partial<HoldingInput>) {
    onChange({ ...value, ...fields });
  }

  return (
    <div className="space-y-4 rounded-lg border border-input p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-symbol`}>Symbol</Label>
          <Input
            id={`${idPrefix}-symbol`}
            value={value.symbol}
            onChange={(event) => patch({ symbol: event.target.value })}
            placeholder="VOO"
          />
          {errors?.symbol && (
            <p className="text-sm text-destructive">{errors.symbol}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-asset_type`}>Asset type</Label>
          <select
            id={`${idPrefix}-asset_type`}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={value.asset_type}
            onChange={(event) =>
              patch({
                asset_type: event.target.value as HoldingInput["asset_type"],
              })
            }
          >
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-asset_name`}>Asset name (optional)</Label>
          <Input
            id={`${idPrefix}-asset_name`}
            value={value.asset_name ?? ""}
            onChange={(event) =>
              patch({ asset_name: event.target.value || null })
            }
          />
        </div>

        {usesMarketQuote ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-shares`}>Shares</Label>
            <Input
              id={`${idPrefix}-shares`}
              type="number"
              min={0}
              step="0.0001"
              value={value.shares ?? ""}
              onChange={(event) =>
                patch({
                  shares: event.target.value
                    ? event.target.valueAsNumber
                    : null,
                })
              }
            />
            {errors?.shares && (
              <p className="text-sm text-destructive">{errors.shares}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Market value is fetched automatically from Yahoo Finance.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-current_value`}>Current value</Label>
            <Input
              id={`${idPrefix}-current_value`}
              type="number"
              min={0}
              step="0.01"
              value={value.current_value ?? 0}
              onChange={(event) =>
                patch({ current_value: event.target.valueAsNumber || 0 })
              }
            />
            {errors?.current_value && (
              <p className="text-sm text-destructive">{errors.current_value}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cost_basis`}>Cost basis (optional)</Label>
          <Input
            id={`${idPrefix}-cost_basis`}
            type="number"
            min={0}
            step="0.01"
            value={value.cost_basis ?? ""}
            onChange={(event) =>
              patch({
                cost_basis: event.target.value
                  ? event.target.valueAsNumber
                  : null,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-broker`}>Broker (optional)</Label>
          <Input
            id={`${idPrefix}-broker`}
            value={value.broker ?? ""}
            onChange={(event) =>
              patch({ broker: event.target.value || null })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
