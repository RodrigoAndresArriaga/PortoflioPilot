"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildWatchlistOptions,
  createWatchlistItemFromCustomInput,
  type HoldingInput,
  type WatchlistItemInput,
} from "@/lib/validation/onboarding";

type WatchlistStepProps = {
  value: WatchlistItemInput[];
  holdings: HoldingInput[];
  onChange: (value: WatchlistItemInput[]) => void;
  errors?: Record<string, string>;
  optional?: boolean;
};

export function WatchlistStep({
  value,
  holdings,
  onChange,
  errors,
  optional = false,
}: WatchlistStepProps) {
  const options = buildWatchlistOptions(holdings);
  const selectedSymbols = new Set(
    value.map((item) => item.symbol.trim().toUpperCase()),
  );

  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customAssetType, setCustomAssetType] = useState<"etf" | "stock">("etf");
  const [customBucket, setCustomBucket] = useState<"core_etf" | "growth">(
    "core_etf",
  );
  const [customError, setCustomError] = useState<string | null>(null);

  function removeSymbol(symbol: string) {
    onChange(
      value
        .filter((item) => item.symbol !== symbol)
        .map((item, index) => ({ ...item, sort_order: index })),
    );
  }

  function toggleSymbol(
    option: (typeof options)[number],
    checked: boolean,
  ) {
    if (checked) {
      onChange([
        ...value,
        {
          symbol: option.symbol,
          asset_name: option.asset_name,
          asset_type: option.asset_type,
          bucket: option.bucket,
          sort_order: value.length,
        },
      ]);
      return;
    }

    removeSymbol(option.symbol);
  }

  function addCustomSymbol() {
    const symbol = customSymbol.trim().toUpperCase();
    if (!symbol) {
      setCustomError("Symbol is required");
      return;
    }

    if (selectedSymbols.has(symbol)) {
      setCustomError("Symbol is already on your watchlist");
      return;
    }

    onChange([
      ...value,
      createWatchlistItemFromCustomInput(
        {
          symbol,
          asset_name: customName || null,
          asset_type: customAssetType,
          bucket: customBucket,
        },
        value.length,
      ),
    ]);

    setCustomSymbol("");
    setCustomName("");
    setCustomAssetType("etf");
    setCustomBucket("core_etf");
    setCustomError(null);
  }

  const coreOptions = options.filter((item) => item.bucket === "core_etf");
  const growthOptions = options.filter((item) => item.bucket === "growth");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Watchlist</h3>
        <p className="text-sm text-muted-foreground">
          Select symbols to monitor or add your own tickers. Keep the list
          focused — fewer tickers means less noise.
        </p>
        {optional && (
          <p className="text-sm text-muted-foreground">
            You can skip this step and add symbols later in Settings. ChatGPT
            prompts on the Instructions page need at least one symbol when you
            are ready.
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Core ETFs</legend>
        {coreOptions.map((option) => (
          <label
            key={option.symbol}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selectedSymbols.has(option.symbol)}
              onChange={(event) => toggleSymbol(option, event.target.checked)}
              className="size-4"
            />
            <span className="text-sm">
              {option.symbol}
              {option.asset_name ? ` — ${option.asset_name}` : ""}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Growth stocks</legend>
        {growthOptions.map((option) => (
          <label
            key={option.symbol}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selectedSymbols.has(option.symbol)}
              onChange={(event) => toggleSymbol(option, event.target.checked)}
              className="size-4"
            />
            <span className="text-sm">
              {option.symbol}
              {option.asset_name ? ` — ${option.asset_name}` : ""}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-3 rounded-lg border border-input p-4">
        <p className="text-sm font-medium">Add custom symbol</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="custom-symbol">Symbol</Label>
            <Input
              id="custom-symbol"
              value={customSymbol}
              onChange={(event) => {
                setCustomSymbol(event.target.value);
                setCustomError(null);
              }}
              placeholder="IWDA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-name">Name (optional)</Label>
            <Input
              id="custom-name"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-asset-type">Type</Label>
            <select
              id="custom-asset-type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={customAssetType}
              onChange={(event) =>
                setCustomAssetType(event.target.value as "etf" | "stock")
              }
            >
              <option value="etf">ETF</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-bucket">Bucket</Label>
            <select
              id="custom-bucket"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={customBucket}
              onChange={(event) =>
                setCustomBucket(event.target.value as "core_etf" | "growth")
              }
            >
              <option value="core_etf">Core ETF</option>
              <option value="growth">Growth</option>
            </select>
          </div>
        </div>

        {customError && (
          <p className="text-sm text-destructive">{customError}</p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addCustomSymbol}>
          Add to watchlist
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Your selections</p>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {optional
              ? "No symbols selected yet. Pick presets, add a custom ticker, or skip for now."
              : "No symbols selected yet. Pick presets or add a custom ticker."}
          </p>
        ) : (
          <ul className="space-y-2">
            {value.map((item) => (
              <li
                key={item.symbol}
                className="flex items-center justify-between gap-3 rounded-md border border-input px-3 py-2"
              >
                <span className="text-sm">
                  {item.symbol}
                  {item.asset_name ? ` — ${item.asset_name}` : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSymbol(item.symbol)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errors?.watchlist && (
        <p className="text-sm text-destructive">{errors.watchlist}</p>
      )}

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
