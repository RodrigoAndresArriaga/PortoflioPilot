import { describe, expect, it } from "vitest";

import {
  dailyNoUrgentFixture,
  dailyUrgentFixture,
  monthlyReviewFixture,
  weeklyReviewFixture,
} from "@/lib/validation/__tests__/news-input.fixtures";
import {
  dailyUrgentScanSchema,
  monthlyAllocationReviewSchema,
  newsReportSchema,
  parsePastedNewsJson,
  weeklyMarketReviewSchema,
} from "@/lib/validation/news-input";

describe("news input validation", () => {
  it("accepts daily no-urgent report", () => {
    expect(dailyUrgentScanSchema.parse(dailyNoUrgentFixture)).toEqual(
      dailyNoUrgentFixture,
    );
  });

  it("accepts daily urgent report with events", () => {
    expect(dailyUrgentScanSchema.parse(dailyUrgentFixture)).toEqual(
      dailyUrgentFixture,
    );
  });

  it("accepts weekly market review", () => {
    expect(weeklyMarketReviewSchema.parse(weeklyReviewFixture)).toEqual(
      weeklyReviewFixture,
    );
  });

  it("accepts monthly allocation review", () => {
    expect(monthlyAllocationReviewSchema.parse(monthlyReviewFixture)).toEqual(
      monthlyReviewFixture,
    );
  });

  it("parses pasted JSON strings", () => {
    const parsed = parsePastedNewsJson(JSON.stringify(dailyNoUrgentFixture));
    expect(parsed.report_type).toBe("daily_urgent_scan");
  });

  it("rejects invalid JSON strings", () => {
    expect(() => parsePastedNewsJson("{bad json")).toThrow(/Invalid JSON/);
  });

  it("rejects urgent daily report without events", () => {
    expect(() =>
      dailyUrgentScanSchema.parse({
        ...dailyUrgentFixture,
        events: [],
      }),
    ).toThrow();
  });

  it("rejects out-of-range news_score", () => {
    expect(() =>
      monthlyAllocationReviewSchema.parse({
        ...monthlyReviewFixture,
        symbols: [
          {
            ...monthlyReviewFixture.symbols[0],
            news_score: 150,
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects wrong report_type in discriminated union", () => {
    expect(() =>
      newsReportSchema.parse({
        ...weeklyReviewFixture,
        report_type: "daily_urgent_scan",
      }),
    ).toThrow();
  });

  it("rejects malformed report_month", () => {
    expect(() =>
      monthlyAllocationReviewSchema.parse({
        ...monthlyReviewFixture,
        report_month: "2026-13",
      }),
    ).toThrow();
  });
});
