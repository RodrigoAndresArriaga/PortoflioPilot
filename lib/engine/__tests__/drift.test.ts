import { describe, expect, it } from "vitest";

import { computeTargetAllocation } from "@/lib/engine/allocation";
import {
  applyDriftToResult,
  assignPriorities,
  computeDriftPercent,
  DEFAULT_DRIFT_BAND_PERCENT,
  deriveActionStatus,
  deriveDriftStatus,
} from "@/lib/engine/drift";
import type { PreDriftAllocationResult } from "@/lib/engine/drift";

function makePreDriftResult(
  partial: Partial<PreDriftAllocationResult> &
    Pick<PreDriftAllocationResult, "symbol">,
): PreDriftAllocationResult {
  return {
    current_value: 5000,
    current_weight: 0.48,
    target_weight: 0.55,
    target_value: 11000,
    allocation_gap: 1800,
    recommended_buy: 1800,
    status: "on_target",
    reason: "",
    ...partial,
  };
}

describe("computeDriftPercent", () => {
  it("returns percentage points below target", () => {
    expect(computeDriftPercent(0.48, 0.55)).toBe(-7);
  });

  it("returns percentage points above target", () => {
    expect(computeDriftPercent(0.62, 0.55)).toBe(7);
  });
});

describe("deriveDriftStatus", () => {
  it("uses the default 5 percentage point band", () => {
    expect(DEFAULT_DRIFT_BAND_PERCENT).toBe(5);
  });

  it("treats exact band edges as normal", () => {
    expect(deriveDriftStatus(-5)).toBe("normal");
    expect(deriveDriftStatus(5)).toBe("normal");
  });

  it("prioritizes below the lower band", () => {
    expect(deriveDriftStatus(-5.01)).toBe("prioritize");
  });

  it("stops buying above the upper band", () => {
    expect(deriveDriftStatus(5.01)).toBe("stop_buying");
  });
});

describe("deriveActionStatus", () => {
  it("mirrors drift status", () => {
    expect(deriveActionStatus("normal")).toBe("normal");
    expect(deriveActionStatus("prioritize")).toBe("prioritize");
    expect(deriveActionStatus("stop_buying")).toBe("stop_buying");
  });
});

describe("applyDriftToResult", () => {
  it("gates buys inside the band", () => {
    const result = applyDriftToResult(
      makePreDriftResult({
        current_weight: 0.575,
        target_weight: 0.55,
        recommended_buy: 1800,
      }),
    );

    expect(result).toMatchObject({
      drift_percent: 2.5,
      drift_status: "normal",
      action_status: "normal",
      recommended_buy: 0,
      status: "on_target",
      priority: null,
    });
  });

  it("keeps buys below the band", () => {
    const result = applyDriftToResult(
      makePreDriftResult({
        current_weight: 0.48,
        target_weight: 0.55,
        recommended_buy: 1800,
      }),
    );

    expect(result).toMatchObject({
      drift_percent: -7,
      drift_status: "prioritize",
      action_status: "prioritize",
      recommended_buy: 1800,
      status: "underweight",
    });
  });

  it("blocks buys above the band", () => {
    const result = applyDriftToResult(
      makePreDriftResult({
        current_weight: 0.62,
        target_weight: 0.55,
        allocation_gap: -1400,
        recommended_buy: 0,
      }),
    );

    expect(result).toMatchObject({
      drift_percent: 7,
      drift_status: "stop_buying",
      action_status: "stop_buying",
      recommended_buy: 0,
      status: "overweight",
    });
  });

  it("never recommends sells", () => {
    const result = applyDriftToResult(
      makePreDriftResult({
        current_weight: 0.8,
        target_weight: 0.55,
        allocation_gap: -5000,
        recommended_buy: 0,
      }),
    );

    expect(result.recommended_buy).toBeGreaterThanOrEqual(0);
    expect(result.action_status).not.toBe("sell");
  });
});

describe("assignPriorities", () => {
  it("ranks prioritize assets by drift magnitude", () => {
    const results = assignPriorities([
      applyDriftToResult(
        makePreDriftResult({
          symbol: "QQQ",
          current_weight: 0.15,
          target_weight: 0.25,
          recommended_buy: 900,
        }),
      ),
      applyDriftToResult(
        makePreDriftResult({
          symbol: "VOO",
          current_weight: 0.4,
          target_weight: 0.55,
          recommended_buy: 1800,
        }),
      ),
    ]);

    expect(results.find((result) => result.symbol === "VOO")).toMatchObject({
      priority: 1,
    });
    expect(results.find((result) => result.symbol === "QQQ")).toMatchObject({
      priority: 2,
    });
  });

  it("leaves non-prioritize assets without priority", () => {
    const results = assignPriorities([
      applyDriftToResult(
        makePreDriftResult({
          symbol: "VOO",
          current_weight: 0.575,
          target_weight: 0.55,
          recommended_buy: 1800,
        }),
      ),
    ]);

    expect(results[0].priority).toBeNull();
  });
});

describe("computeTargetAllocation drift integration", () => {
  function findSymbol(
    results: ReturnType<typeof computeTargetAllocation>,
    symbol: string,
  ) {
    return results.find((result) => result.symbol === symbol);
  }

  it("treats the VOO spec example as inside band with no buy", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 9200 },
        { symbol: "CASH", current_value: 6800 },
      ],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    expect(findSymbol(results, "VOO")).toMatchObject({
      current_weight: 0.575,
      target_weight: 0.55,
      drift_percent: 2.5,
      drift_status: "normal",
      action_status: "normal",
      recommended_buy: 0,
      status: "on_target",
      priority: null,
    });
  });

  it("prioritizes VOO when below the lower band", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 7680 },
        { symbol: "CASH", current_value: 8320 },
      ],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    expect(findSymbol(results, "VOO")).toMatchObject({
      current_weight: 0.48,
      drift_status: "prioritize",
      action_status: "prioritize",
      recommended_buy: expect.any(Number),
      priority: 1,
    });
    expect(findSymbol(results, "VOO")?.recommended_buy).toBeGreaterThan(0);
  });

  it("stops buying VOO when above the upper band", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 9920 },
        { symbol: "CASH", current_value: 6080 },
      ],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    expect(findSymbol(results, "VOO")).toMatchObject({
      current_weight: 0.62,
      drift_status: "stop_buying",
      action_status: "stop_buying",
      recommended_buy: 0,
      status: "overweight",
    });
  });

  it("prioritizes underweight assets and blocks overweight assets", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 5000 },
        { symbol: "QQQ", current_value: 2000 },
        { symbol: "VXUS", current_value: 9000 },
      ],
      target_allocations: [
        { symbol: "VOO", target_weight: 0.55 },
        { symbol: "QQQ", target_weight: 0.25 },
        { symbol: "VXUS", target_weight: 0.2 },
      ],
      monthly_investment_amount: 4000,
    });

    const underweight = results.filter(
      (result) => result.drift_status === "prioritize",
    );
    const overweight = results.filter(
      (result) => result.drift_status === "stop_buying",
    );

    expect(underweight.length).toBeGreaterThan(0);
    expect(overweight.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.recommended_buy).toBeGreaterThanOrEqual(0);
      expect(result.drift_percent).toBeDefined();
      expect(result.drift_status).toBeDefined();
      expect(result.action_status).toBeDefined();
      expect(result).toHaveProperty("priority");
    }

    for (let index = 0; index < underweight.length - 1; index += 1) {
      expect(underweight[index].priority).toBeLessThan(
        underweight[index + 1].priority ?? Number.MAX_SAFE_INTEGER,
      );
    }
  });
});
