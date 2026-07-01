import { describe, expect, it } from "vitest";

import {
  buildNewsInputChildRows,
  buildNewsInputHeaderRow,
} from "@/lib/news-input/fan-out";
import {
  dailyNoUrgentFixture,
  dailyUrgentFixture,
  monthlyReviewFixture,
  weeklyReviewFixture,
} from "@/lib/validation/__tests__/news-input.fixtures";

const context = {
  userId: "user-1",
  portfolioId: "portfolio-1",
  headerId: "header-1",
};

describe("news input fan-out", () => {
  it("builds header row with payload", () => {
    const header = buildNewsInputHeaderRow(
      monthlyReviewFixture,
      context.userId,
      context.portfolioId,
    );

    expect(header.is_report_header).toBe(true);
    expect(header.parent_id).toBeNull();
    expect(header.report_period).toBe("2026-07");
    expect(header.payload).toEqual(monthlyReviewFixture);
  });

  it("returns zero child rows for daily no-urgent report", () => {
    const children = buildNewsInputChildRows(dailyNoUrgentFixture, context);
    expect(children).toHaveLength(0);
  });

  it("maps daily urgent events to child rows", () => {
    const children = buildNewsInputChildRows(dailyUrgentFixture, context);

    expect(children).toHaveLength(1);
    expect(children[0].symbol).toBe("NVDA");
    expect(children[0].asset_type).toBe("stock");
    expect(children[0].news_score).toBe(35);
    expect(children[0].parent_id).toBe("header-1");
  });

  it("maps weekly symbols_to_watch to child rows", () => {
    const children = buildNewsInputChildRows(weeklyReviewFixture, context);

    expect(children).toHaveLength(1);
    expect(children[0].symbol).toBe("QQQ");
    expect(children[0].reason).toContain("Momentum");
    expect(children[0].suggested_frontend_status).toBe("watch");
    expect(children[0].news_score).toBeNull();
  });

  it("maps monthly symbols to child rows with normalized asset type", () => {
    const children = buildNewsInputChildRows(monthlyReviewFixture, context);

    expect(children).toHaveLength(2);
    expect(children[0].symbol).toBe("VOO");
    expect(children[0].asset_type).toBe("etf");
    expect(children[0].ai_bias).toBe("add");
    expect(children[1].symbol).toBe("NVDA");
  });
});
