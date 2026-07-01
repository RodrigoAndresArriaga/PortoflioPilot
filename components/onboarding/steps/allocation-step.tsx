"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HoldingInput } from "@/lib/validation/onboarding";
import {
  BUCKET_DEFINITIONS,
  getRecommendedBucketsForRisk,
  getSymbolTargetsFromHoldings,
  riskProfileSchema,
  type AllocationStepValue,
  type AllocationMode,
} from "@/lib/validation/onboarding";
import type { z } from "zod";

type RiskProfile = z.infer<typeof riskProfileSchema>;

type AllocationStepProps = {
  value: AllocationStepValue;
  riskProfile: RiskProfile;
  holdings: HoldingInput[];
  onChange: (value: AllocationStepValue) => void;
  errors?: Record<string, string>;
};

const MODE_OPTIONS = [
  {
    mode: "auto" as const,
    title: "No preference / Let PortfolioPilot decide",
    subtitle: "Best for beginners.",
    description:
      "PortfolioPilot chooses a disciplined default based on your risk profile and time horizon.",
  },
  {
    mode: "bucket" as const,
    title: "Customize by type",
    subtitle: "Best for most users.",
    description: "Edit bucket percentages only. PortfolioPilot picks symbols inside each bucket.",
  },
  {
    mode: "symbol" as const,
    title: "Advanced: customize by symbol",
    subtitle: "Best for experienced users.",
    description: "Set exact symbol targets when you want full control.",
  },
];

function getBucketLabel(bucketKey: string): string {
  return (
    BUCKET_DEFINITIONS.find((bucket) => bucket.bucket_key === bucketKey)
      ?.label ?? bucketKey
  );
}

function sumBuckets(buckets: AllocationStepValue["target_buckets"]): number {
  return buckets
    .filter((bucket) => bucket.enabled)
    .reduce((total, bucket) => total + bucket.target_percent, 0);
}

function sumAssets(assets: AllocationStepValue["target_assets"]): number {
  return assets.reduce((total, asset) => total + asset.target_percent, 0);
}

export function AllocationStep({
  value,
  riskProfile,
  holdings,
  onChange,
  errors,
}: AllocationStepProps) {
  const bucketTotal = sumBuckets(value.target_buckets);
  const bucketTotalValid = Math.abs(bucketTotal - 100) <= 0.01;
  const assetTotal = sumAssets(value.target_assets);
  const assetTotalValid = Math.abs(assetTotal - 100) <= 0.01;

  const visibleBuckets = value.include_individual_stock_bucket
    ? value.target_buckets
    : value.target_buckets.filter(
        (bucket) => bucket.bucket_key !== "individual_stock",
      );

  function patchValue(patch: Partial<AllocationStepValue>) {
    onChange({ ...value, ...patch });
  }

  function selectMode(mode: AllocationMode) {
    if (mode === "auto") {
      patchValue({
        allocation_mode: "auto",
        target_buckets: getRecommendedBucketsForRisk(
          riskProfile,
          value.include_individual_stock_bucket,
        ),
      });
      return;
    }

    if (mode === "bucket") {
      patchValue({
        allocation_mode: "bucket",
        target_buckets: getRecommendedBucketsForRisk(
          riskProfile,
          value.include_individual_stock_bucket,
        ),
      });
      return;
    }

    patchValue({
      allocation_mode: "symbol",
      target_assets:
        value.target_assets.length > 0
          ? value.target_assets
          : getSymbolTargetsFromHoldings(
              holdings,
              riskProfile,
              value.include_individual_stock_bucket,
            ),
    });
  }

  function applyRecommendedBuckets() {
    patchValue({
      allocation_mode: "auto",
      target_buckets: getRecommendedBucketsForRisk(
        riskProfile,
        value.include_individual_stock_bucket,
      ),
    });
  }

  function updateBucketPercent(bucketKey: string, targetPercent: number) {
    patchValue({
      target_buckets: value.target_buckets.map((bucket) =>
        bucket.bucket_key === bucketKey
          ? { ...bucket, target_percent: targetPercent }
          : bucket,
      ),
    });
  }

  function toggleIndividualStockBucket(checked: boolean) {
    const nextBuckets = getRecommendedBucketsForRisk(riskProfile, checked);
    patchValue({
      include_individual_stock_bucket: checked,
      target_buckets: nextBuckets,
    });
  }

  function updateAsset(
    index: number,
    patch: Partial<AllocationStepValue["target_assets"][number]>,
  ) {
    patchValue({
      target_assets: value.target_assets.map((asset, i) =>
        i === index ? { ...asset, ...patch } : asset,
      ),
    });
  }

  function addAssetRow() {
    patchValue({
      target_assets: [
        ...value.target_assets,
        { symbol: "", bucket_key: "core_etf", target_percent: 0 },
      ],
    });
  }

  function removeAssetRow(index: number) {
    patchValue({
      target_assets: value.target_assets.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Target allocation</h3>
        <p className="text-sm text-muted-foreground">
          Choose how PortfolioPilot should guide your monthly investments.
        </p>
      </div>

      <div className="space-y-3">
        {MODE_OPTIONS.map((option) => (
          <label
            key={option.mode}
            className={`block cursor-pointer rounded-lg border p-4 ${
              value.allocation_mode === option.mode
                ? "border-primary bg-primary/5"
                : "border-input"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="allocation_mode"
                checked={value.allocation_mode === option.mode}
                onChange={() => selectMode(option.mode)}
                className="mt-1 size-4"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {value.allocation_mode === "auto" && (
        <div className="space-y-4 rounded-lg border border-input p-4">
          <p className="text-sm text-muted-foreground">
            Example for {riskProfile.replace("_", " ")}:
          </p>
          <BucketTable
            buckets={getRecommendedBucketsForRisk(
              riskProfile,
              value.include_individual_stock_bucket,
            )}
            readOnly
          />
          <Button type="button" variant="outline" onClick={applyRecommendedBuckets}>
            Use recommended allocation
          </Button>
        </div>
      )}

      {value.allocation_mode === "bucket" && (
        <div className="space-y-4 rounded-lg border border-input p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={bucketTotalValid ? "secondary" : "destructive"}>
              Total: {bucketTotal.toFixed(1)}%
            </Badge>
          </div>

          <BucketTable
            buckets={visibleBuckets}
            onChangePercent={updateBucketPercent}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.include_individual_stock_bucket}
              onChange={(event) =>
                toggleIndividualStockBucket(event.target.checked)
              }
              className="size-4"
            />
            Include individual stocks bucket (optional advanced bucket)
          </label>
        </div>
      )}

      {value.allocation_mode === "symbol" && (
        <div className="space-y-4 rounded-lg border border-input p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addAssetRow}>
              Add row
            </Button>
            <Badge variant={assetTotalValid ? "secondary" : "destructive"}>
              Total: {assetTotal.toFixed(1)}%
            </Badge>
          </div>

          <div className="space-y-3">
            {value.target_assets.map((asset, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-md border border-input p-3 sm:grid-cols-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`asset-symbol-${index}`}>Symbol</Label>
                      <Input
                        id={`asset-symbol-${index}`}
                        value={asset.symbol}
                        onChange={(event) =>
                          updateAsset(index, { symbol: event.target.value })
                        }
                        placeholder="VOO"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`asset-bucket-${index}`}>Bucket</Label>
                      <select
                        id={`asset-bucket-${index}`}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        value={asset.bucket_key}
                        onChange={(event) =>
                          updateAsset(index, {
                            bucket_key: event.target
                              .value as AllocationStepValue["target_assets"][number]["bucket_key"],
                          })
                        }
                      >
                        {BUCKET_DEFINITIONS.map((bucket) => (
                          <option key={bucket.bucket_key} value={bucket.bucket_key}>
                            {bucket.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`asset-percent-${index}`}>Target %</Label>
                      <Input
                        id={`asset-percent-${index}`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={asset.target_percent}
                        onChange={(event) =>
                          updateAsset(index, {
                            target_percent: event.target.valueAsNumber || 0,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAssetRow(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {errors?.target_buckets && (
        <p className="text-sm text-destructive">{errors.target_buckets}</p>
      )}

      {errors?.target_assets && (
        <p className="text-sm text-destructive">{errors.target_assets}</p>
      )}

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

type BucketTableProps = {
  buckets: AllocationStepValue["target_buckets"];
  readOnly?: boolean;
  onChangePercent?: (bucketKey: string, targetPercent: number) => void;
};

function BucketTable({
  buckets,
  readOnly = false,
  onChangePercent,
}: BucketTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-input">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Bucket</th>
            <th className="px-3 py-2 text-right font-medium">Target</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.bucket_key} className="border-t border-input">
              <td className="px-3 py-2">{getBucketLabel(bucket.bucket_key)}</td>
              <td className="px-3 py-2 text-right">
                {readOnly || !onChangePercent ? (
                  <span>{bucket.target_percent}%</span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={bucket.target_percent}
                    onChange={(event) =>
                      onChangePercent(
                        bucket.bucket_key,
                        event.target.valueAsNumber || 0,
                      )
                    }
                    className="ml-auto w-24 text-right"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
