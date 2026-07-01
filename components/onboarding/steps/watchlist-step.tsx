"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  buildWatchlistOptions,
  type HoldingInput,
  type WatchlistItemInput,
} from "@/lib/validation/onboarding";

type WatchlistStepProps = {
  value: WatchlistItemInput[];
  holdings: HoldingInput[];
  onChange: (value: WatchlistItemInput[]) => void;
  errors?: Record<string, string>;
};

export function WatchlistStep({
  value,
  holdings,
  onChange,
  errors,
}: WatchlistStepProps) {
  const options = buildWatchlistOptions(holdings);
  const selectedSymbols = new Set(value.map((item) => item.symbol));

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

    onChange(
      value
        .filter((item) => item.symbol !== option.symbol)
        .map((item, index) => ({ ...item, sort_order: index })),
    );
  }

  const coreOptions = options.filter((item) => item.bucket === "core_etf");
  const growthOptions = options.filter((item) => item.bucket === "growth");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Watchlist</h3>
        <p className="text-sm text-muted-foreground">
          Select symbols to monitor. Keep the list focused — fewer tickers means
          less noise.
        </p>
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

      <p className="text-sm text-muted-foreground">
        Selected: {value.length} symbol{value.length === 1 ? "" : "s"}
      </p>

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
