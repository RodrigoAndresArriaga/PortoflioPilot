import { roundMoney } from "@/lib/engine/math";
import type { PriceBar } from "@/lib/market-data/types";

const TRADING_DAYS_3M = 63;
const TRADING_DAYS_6M = 126;
const TRADING_DAYS_12M = 252;
const TRADING_DAYS_90D = 90;
const SMA_50 = 50;
const SMA_200 = 200;

function closes(bars: PriceBar[]): number[] {
  return bars.map((bar) => bar.close);
}

function returnPercent(current: number, past: number): number {
  if (past <= 0) {
    return 0;
  }
  return roundMoney(((current - past) / past) * 100, 2);
}

function barAtOffset(bars: PriceBar[], offsetFromEnd: number): number | null {
  const index = bars.length - 1 - offsetFromEnd;
  if (index < 0) {
    return null;
  }
  return bars[index]?.close ?? null;
}

// map return percent to 0-100 score
export function returnToScore(returnPct: number): number {
  if (returnPct <= -30) {
    return 0;
  }
  if (returnPct >= 30) {
    return 100;
  }
  return roundMoney(((returnPct + 30) / 60) * 100, 2);
}

export function computeSma(values: number[], period: number): number | null {
  if (values.length < period) {
    return null;
  }
  const slice = values.slice(-period);
  const sum = slice.reduce((total, value) => total + value, 0);
  return roundMoney(sum / period, 4);
}

// 100 when price is well above MA, 0 when well below
export function priceAboveMaScore(price: number, ma: number | null): number {
  if (!ma || ma <= 0) {
    return 50;
  }
  const ratio = (price - ma) / ma;
  const score = 50 + ratio * 200;
  return roundMoney(Math.min(100, Math.max(0, score)), 2);
}

export function computeReturnsFromBars(bars: PriceBar[]): {
  return_3m: number;
  return_6m: number;
  return_12m: number;
} {
  const latest = bars[bars.length - 1]?.close ?? 0;
  const past3m = barAtOffset(bars, TRADING_DAYS_3M) ?? latest;
  const past6m = barAtOffset(bars, TRADING_DAYS_6M) ?? latest;
  const past12m = barAtOffset(bars, TRADING_DAYS_12M) ?? latest;

  return {
    return_3m: returnPercent(latest, past3m),
    return_6m: returnPercent(latest, past6m),
    return_12m: returnPercent(latest, past12m),
  };
}

export function computeMaxDrawdown1y(bars: PriceBar[]): number {
  const recent = bars.slice(-TRADING_DAYS_12M);
  if (recent.length < 2) {
    return 0;
  }

  let peak = recent[0].close;
  let maxDrawdown = 0;

  for (const bar of recent) {
    peak = Math.max(peak, bar.close);
    if (peak <= 0) {
      continue;
    }
    const drawdown = ((peak - bar.close) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return roundMoney(maxDrawdown, 2);
}

export function computeVolatility90d(bars: PriceBar[]): number {
  const recent = bars.slice(-(TRADING_DAYS_90D + 1));
  if (recent.length < 2) {
    return 0;
  }

  const dailyReturns: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    const prev = recent[index - 1].close;
    const current = recent[index].close;
    if (prev <= 0) {
      continue;
    }
    dailyReturns.push((current - prev) / prev);
  }

  if (dailyReturns.length === 0) {
    return 0;
  }

  const mean =
    dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  return roundMoney(stdDev * Math.sqrt(252) * 100, 2);
}

export function computeDownsideVolatility90d(bars: PriceBar[]): number {
  const recent = bars.slice(-(TRADING_DAYS_90D + 1));
  if (recent.length < 2) {
    return 0;
  }

  const negativeReturns: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    const prev = recent[index - 1].close;
    const current = recent[index].close;
    if (prev <= 0) {
      continue;
    }
    const dailyReturn = (current - prev) / prev;
    if (dailyReturn < 0) {
      negativeReturns.push(dailyReturn);
    }
  }

  if (negativeReturns.length === 0) {
    return 0;
  }

  const mean =
    negativeReturns.reduce((sum, value) => sum + value, 0) /
    negativeReturns.length;
  const variance =
    negativeReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    negativeReturns.length;
  return roundMoney(Math.sqrt(variance) * Math.sqrt(252) * 100, 2);
}

export function computeBeta(
  assetBars: PriceBar[],
  benchmarkBars: PriceBar[],
): number {
  const length = Math.min(assetBars.length, benchmarkBars.length);
  if (length < 30) {
    return 1;
  }

  const assetSlice = assetBars.slice(-length);
  const benchmarkSlice = benchmarkBars.slice(-length);
  const assetReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let index = 1; index < length; index += 1) {
    const assetPrev = assetSlice[index - 1].close;
    const assetCurrent = assetSlice[index].close;
    const benchPrev = benchmarkSlice[index - 1].close;
    const benchCurrent = benchmarkSlice[index].close;
    if (assetPrev <= 0 || benchPrev <= 0) {
      continue;
    }
    assetReturns.push((assetCurrent - assetPrev) / assetPrev);
    benchmarkReturns.push((benchCurrent - benchPrev) / benchPrev);
  }

  if (assetReturns.length < 10) {
    return 1;
  }

  const assetMean =
    assetReturns.reduce((sum, value) => sum + value, 0) / assetReturns.length;
  const benchMean =
    benchmarkReturns.reduce((sum, value) => sum + value, 0) /
    benchmarkReturns.length;

  let covariance = 0;
  let benchVariance = 0;
  for (let index = 0; index < assetReturns.length; index += 1) {
    const assetDiff = assetReturns[index] - assetMean;
    const benchDiff = benchmarkReturns[index] - benchMean;
    covariance += assetDiff * benchDiff;
    benchVariance += benchDiff ** 2;
  }

  if (benchVariance === 0) {
    return 1;
  }

  const beta = covariance / benchVariance;
  return roundMoney(Math.min(3, Math.max(0, beta)), 2);
}

// invert risk metric to safety score 0-100
export function riskMetricToSafetyScore(metric: number, maxBad = 40): number {
  const clamped = Math.min(maxBad, Math.max(0, metric));
  return roundMoney(100 - (clamped / maxBad) * 100, 2);
}

export function getLatestClose(bars: PriceBar[]): number {
  return bars[bars.length - 1]?.close ?? 0;
}

export function getMovingAverages(bars: PriceBar[]): {
  sma50: number | null;
  sma200: number | null;
} {
  const values = closes(bars);
  return {
    sma50: computeSma(values, SMA_50),
    sma200: computeSma(values, SMA_200),
  };
}
