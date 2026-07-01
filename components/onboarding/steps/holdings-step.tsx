"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HoldingInput } from "@/lib/validation/onboarding";

type HoldingsStepProps = {
  value: HoldingInput[];
  baseCurrency: string;
  onChange: (value: HoldingInput[]) => void;
  errors?: Record<string, string>;
};

const ASSET_TYPES = ["etf", "stock", "cash", "crypto", "other"] as const;

function createEmptyHolding(currency: string): HoldingInput {
  return {
    symbol: "",
    asset_name: null,
    asset_type: "etf",
    currency: currency as HoldingInput["currency"],
    current_value: 0,
    cost_basis: null,
    shares: null,
    broker: null,
  };
}

export function HoldingsStep({
  value,
  baseCurrency,
  onChange,
  errors,
}: HoldingsStepProps) {
  function updateHolding(index: number, patch: Partial<HoldingInput>) {
    onChange(
      value.map((holding, i) =>
        i === index ? { ...holding, ...patch } : holding,
      ),
    );
  }

  function removeHolding(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addHolding() {
    onChange([...value, createEmptyHolding(baseCurrency)]);
  }

  function loadSampleHoldings() {
    onChange([
      {
        symbol: "VOO",
        asset_name: "Vanguard S&P 500 ETF",
        asset_type: "etf",
        currency: baseCurrency as HoldingInput["currency"],
        current_value: 5000,
        cost_basis: 4800,
        shares: null,
        broker: null,
      },
      {
        symbol: "QQQ",
        asset_name: "Invesco QQQ Trust",
        asset_type: "etf",
        currency: baseCurrency as HoldingInput["currency"],
        current_value: 2000,
        cost_basis: 1900,
        shares: null,
        broker: null,
      },
      {
        symbol: "NVDA",
        asset_name: "NVIDIA Corporation",
        asset_type: "stock",
        currency: baseCurrency as HoldingInput["currency"],
        current_value: 1500,
        cost_basis: 1300,
        shares: null,
        broker: null,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Current holdings</h3>
        <p className="text-sm text-muted-foreground">
          Enter what you already own. Weights use current market value.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addHolding}>
          Add holding
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadSampleHoldings}
        >
          Load sample (VOO, QQQ, NVDA)
        </Button>
      </div>

      <div className="space-y-4">
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No holdings yet. Add at least one position.
          </p>
        )}

        {value.map((holding, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-input p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Holding {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeHolding(index)}
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`symbol-${index}`}>Symbol</Label>
                <Input
                  id={`symbol-${index}`}
                  value={holding.symbol}
                  onChange={(event) =>
                    updateHolding(index, { symbol: event.target.value })
                  }
                  placeholder="VOO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`asset_type-${index}`}>Asset type</Label>
                <select
                  id={`asset_type-${index}`}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={holding.asset_type}
                  onChange={(event) =>
                    updateHolding(index, {
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
                <Label htmlFor={`asset_name-${index}`}>Asset name (optional)</Label>
                <Input
                  id={`asset_name-${index}`}
                  value={holding.asset_name ?? ""}
                  onChange={(event) =>
                    updateHolding(index, {
                      asset_name: event.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`current_value-${index}`}>Current value</Label>
                <Input
                  id={`current_value-${index}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={holding.current_value}
                  onChange={(event) =>
                    updateHolding(index, {
                      current_value: event.target.valueAsNumber || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cost_basis-${index}`}>Cost basis (optional)</Label>
                <Input
                  id={`cost_basis-${index}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={holding.cost_basis ?? ""}
                  onChange={(event) =>
                    updateHolding(index, {
                      cost_basis: event.target.value
                        ? event.target.valueAsNumber
                        : null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`broker-${index}`}>Broker (optional)</Label>
                <Input
                  id={`broker-${index}`}
                  value={holding.broker ?? ""}
                  onChange={(event) =>
                    updateHolding(index, {
                      broker: event.target.value || null,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors?.holdings && (
        <p className="text-sm text-destructive">{errors.holdings}</p>
      )}

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
