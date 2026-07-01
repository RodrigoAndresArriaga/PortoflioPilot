import { describe, expect, it } from "vitest";

import {
  detectConcentrationWarnings,
  detectPortfolioWarnings,
  getBlockedBuySymbols,
} from "@/lib/engine/concentration";
import { detectOverlapWarnings } from "@/lib/engine/overlap";
import type { ConcentrationHolding } from "@/lib/engine/warning-types";

function holding(
  symbol: string,
  asset_type: ConcentrationHolding["asset_type"],
  current_value: number,
): ConcentrationHolding {
  return { symbol, asset_type, current_value };
}

describe("detectConcentrationWarnings", () => {
  it("blocks single stocks above 10% of the portfolio", () => {
    const warnings = detectConcentrationWarnings([
      holding("NVDA", "stock", 1200),
      holding("VOO", "etf", 8800),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      code: "single_stock_concentration",
      severity: "block",
      symbols: ["NVDA"],
      actualPercent: 12,
      blocksBuy: true,
    });
  });

  it("does not warn at exactly 10% single-stock weight", () => {
    const warnings = detectConcentrationWarnings([
      holding("NVDA", "stock", 1000),
      holding("VOO", "etf", 9000),
    ]);

    expect(warnings).toHaveLength(0);
  });

  it("warns just above 10% single-stock weight", () => {
    const warnings = detectConcentrationWarnings([
      holding("NVDA", "stock", 1001),
      holding("VOO", "etf", 8999),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.actualPercent).toBeGreaterThan(10);
  });

  it("ignores ETF positions for the single-stock rule", () => {
    const warnings = detectConcentrationWarnings([
      holding("VOO", "etf", 1500),
      holding("CASH", "cash", 8500),
    ]);

    expect(warnings).toHaveLength(0);
  });

  it("warns when tech exposure exceeds 35%", () => {
    const warnings = detectConcentrationWarnings([
      holding("QQQ", "etf", 2000),
      holding("VGT", "etf", 2000),
      holding("BND", "etf", 6000),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      code: "tech_exposure",
      severity: "warn",
      actualPercent: 40,
      blocksBuy: false,
    });
  });

  it("does not warn at exactly 35% tech exposure", () => {
    const warnings = detectConcentrationWarnings([
      holding("QQQ", "etf", 1750),
      holding("VGT", "etf", 1750),
      holding("BND", "etf", 6500),
    ]);

    expect(warnings).toHaveLength(0);
  });

  it("warns just above 35% tech exposure", () => {
    const warnings = detectConcentrationWarnings([
      holding("QQQ", "etf", 1800),
      holding("VGT", "etf", 1710),
      holding("BND", "etf", 6490),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe("tech_exposure");
    expect(warnings[0]?.actualPercent).toBeGreaterThan(35);
  });
});

describe("detectOverlapWarnings", () => {
  it("warns when VOO and VTI are both material positions", () => {
    const warnings = detectOverlapWarnings([
      holding("VOO", "etf", 3000),
      holding("VTI", "etf", 2500),
      holding("CASH", "cash", 4500),
    ]);

    expect(warnings.find((warning) => warning.code === "voo_vti_redundancy")).toMatchObject({
      code: "voo_vti_redundancy",
      symbols: ["VOO", "VTI"],
      blocksBuy: false,
    });
    expect(warnings.find((warning) => warning.code === "multiple_sp500_etfs")).toMatchObject({
      code: "multiple_sp500_etfs",
      symbols: ["VOO", "VTI"],
    });
  });

  it("skips VOO and VTI warning when one position is below 5%", () => {
    const warnings = detectOverlapWarnings([
      holding("VOO", "etf", 3000),
      holding("VTI", "etf", 300),
      holding("CASH", "cash", 6700),
    ]);

    expect(warnings.find((warning) => warning.code === "voo_vti_redundancy")).toBeUndefined();
  });

  it("warns when multiple S&P 500 ETFs are held", () => {
    const warnings = detectOverlapWarnings([
      holding("VOO", "etf", 4000),
      holding("IVV", "etf", 3000),
      holding("CASH", "cash", 3000),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      code: "multiple_sp500_etfs",
      symbols: ["VOO", "IVV"],
    });
  });

  it("warns when QQQ is held with multiple mega-cap tech stocks", () => {
    const warnings = detectOverlapWarnings([
      holding("QQQ", "etf", 3000),
      holding("NVDA", "stock", 2000),
      holding("AAPL", "stock", 2000),
      holding("VOO", "etf", 3000),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      code: "qqq_mega_cap_concentration",
      symbols: ["QQQ", "NVDA", "AAPL"],
    });
  });

  it("does not warn for QQQ with only one mega-cap stock", () => {
    const warnings = detectOverlapWarnings([
      holding("QQQ", "etf", 4000),
      holding("NVDA", "stock", 2000),
      holding("VOO", "etf", 4000),
    ]);

    expect(
      warnings.find((warning) => warning.code === "qqq_mega_cap_concentration"),
    ).toBeUndefined();
  });
});

describe("detectPortfolioWarnings", () => {
  it("merges concentration and overlap warnings", () => {
    const warnings = detectPortfolioWarnings([
      holding("NVDA", "stock", 1500),
      holding("VOO", "etf", 3000),
      holding("VTI", "etf", 2500),
      holding("QQQ", "etf", 1500),
      holding("AAPL", "stock", 1500),
    ]);

    const codes = warnings.map((warning) => warning.code);
    expect(codes).toContain("single_stock_concentration");
    expect(codes).toContain("voo_vti_redundancy");
    expect(codes).toContain("multiple_sp500_etfs");
    expect(codes).toContain("qqq_mega_cap_concentration");
  });

  it("never emits sell instructions", () => {
    const warnings = detectPortfolioWarnings([
      holding("NVDA", "stock", 5000),
      holding("VOO", "etf", 5000),
    ]);

    for (const warning of warnings) {
      expect(warning.message.toLowerCase()).not.toContain("sell");
      expect(warning.blocksBuy).toBe(warning.severity === "block");
    }
  });
});

describe("getBlockedBuySymbols", () => {
  it("returns only symbols from block-severity warnings", () => {
    const warnings = detectPortfolioWarnings([
      holding("NVDA", "stock", 1500),
      holding("VOO", "etf", 3000),
      holding("VTI", "etf", 2500),
      holding("CASH", "cash", 3000),
    ]);

    const blocked = getBlockedBuySymbols(warnings);

    expect(blocked.has("NVDA")).toBe(true);
    expect(blocked.has("VOO")).toBe(false);
    expect(blocked.has("VTI")).toBe(false);
  });
});
