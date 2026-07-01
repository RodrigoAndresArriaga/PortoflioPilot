# Algorithm Spec

Canonical formulas and rules for PortfolioPilot's recommendation and scoring engine.

**P1 change:** Target allocation gap scoring and drift-band buy blocking are removed. The **decision engine** is primary: it ranks holdings + watchlist by composite recommendation score, applies risk/news guardrails, and allocates the monthly budget. No automatic selling.

**Price inputs:** Weight and concentration calculations assume **auto-updated** `holdings.current_value` from live quotes (B4.5 — see [Market_Data.md](./Market_Data.md)).

---

## Primary recommendation score (P1)

**ETF score** = 30% technical + 20% risk-adjusted + 20% news + 15% diversification + 15% user fit (+ broad ETF boost when enabled)

**Stock score** = 25% technical + 20% quality + 20% news + 15% risk-adjusted + 10% diversification + 10% user fit

Missing inputs default to neutral **50**. Implementation: `lib/engine/final-score.ts`, `lib/engine/recommendation-engine.ts`, `lib/engine/final-position-sizing.ts`.

**Blocking (kept):** single-stock concentration, `ai_bias = avoid`, manual review, extreme volatility reduction.

**Removed:** block buys solely because asset is above target weight.

---

## Legacy algorithms (pre-P1, deprecated)

The sections below describe the retired target-allocation model kept for historical reference.

---

## Core Algorithms (v1, deprecated target-allocation path)

1. ~~Target allocation algorithm~~ (removed P1)
2. ~~Contribution-based rebalancing via allocation gap~~ (removed P1)
3. ~~Drift-band rebalancing~~ (removed P1)
4. Dollar-cost averaging schedule
5. ETF overlap / diversification check
6. Momentum / relative strength score
7. Trend filter
8. Volatility / drawdown risk score
9. Stock factor score
10. ChatGPT news-risk modifier
11. Final position-sizing algorithm

---

## 1. Target Allocation Algorithm

```
portfolio_after_contribution = current_portfolio_value + monthly_contribution
target_value = portfolio_after_contribution × target_weight
buy_gap = target_value - current_asset_value
recommended_buy = max(0, buy_gap)
```

Example:

```
Monthly amount: 4,000 MXN
Target VOO weight: 55%
Portfolio after contribution: 20,000 MXN
Target VOO value: 11,000 MXN
Current VOO value: 9,200 MXN
VOO buy gap = 1,800 MXN
Recommended VOO buy = 1,800 MXN
```

---

## 2. Contribution-Based Rebalancing

Rebalance using new monthly contributions instead of selling.

```
If asset is underweight:
    prioritize new monthly buys
If asset is overweight:
    do not buy more this month
If asset is extremely overweight:
    flag for manual rebalance review
```

---

## 3. Drift-Band Rebalancing

Use drift bands to avoid overreacting to tiny allocation changes.

Example with target VOO weight 55% and drift band ±5%:

```
If VOO weight is between 50% and 60%:
    no rebalance needed
If VOO weight is below 50%:
    prioritize VOO buys
If VOO weight is above 60%:
    stop buying VOO and send review alert
```

---

## 4. Dollar-Cost Averaging Rule

Default behavior:

```
Invest the planned monthly amount every month.
Do not try to perfectly time the market.
Only adjust new contributions when risk signals are strong.
```

---

## 5. ETF Overlap / Concentration Algorithm

Detect redundant exposure:

- Do not hold VOO and VTI as major separate core positions unless intentional.
- If user owns QQQ plus many mega-cap tech stocks: flag tech concentration.
- If user owns multiple S&P 500 ETFs: flag redundancy.
- If one stock exceeds max allocation: block additional buys unless user overrides.

---

## 6. Momentum / Relative Strength Score

```
Momentum Score =
  40% × 12-month return
+ 30% × 6-month return
+ 20% × 3-month return
+ 10% × price above 200-day moving average
```

Use to tilt new contributions, not to rotate the entire portfolio.

Good: QQQ has stronger momentum → allocate this month's growth bucket toward QQQ.
Bad: QQQ has better 3M momentum → sell everything and buy QQQ.

---

## 7. Trend Filter

```
Trend Score =
  40% × price above 200D moving average
+ 30% × price above 50D moving average
+ 30% × 50D moving average above 200D moving average
```

Risk behavior when broad market trend is negative:

- Pause aggressive stock buys
- Continue core ETF carefully
- Increase cash reserve
- Do not panic-sell broad ETFs based only on trend deterioration

---

## 8. Volatility / Drawdown Risk Score

```
Risk Score =
  35% × 90-day volatility
+ 25% × 1-year max drawdown
+ 20% × beta
+ 20% × downside volatility
```

Rules:

- Single stock > 10% of portfolio → block additional buys unless user overrides
- Tech sector > 35% → warn sector concentration
- Drawdown > 30% → require manual review
- Extreme volatility → reduce monthly allocation

---

## 9. Stock Factor Score

```
Stock Score =
  25% × quality
+ 20% × value
+ 20% × momentum
+ 20% × risk / volatility
+ 15% × growth / fundamentals
```

Example metrics:

| Factor | Metrics |
|--------|---------|
| Quality | ROE, ROIC, profit margin, debt/equity, free cash flow margin |
| Value | P/E, forward P/E, P/S, EV/EBITDA, free cash flow yield |
| Momentum | 3M, 6M, 12M return |
| Risk | 30D/90D volatility, beta, max drawdown |
| Growth | revenue growth, EPS growth, free cash flow growth |

---

## 10. ETF Final Score

```
ETF Final Score =
  35% × target allocation gap
+ 25% × trend score
+ 20% × momentum score
+ 15% × volatility/risk score
+  5% × news score
```

News has low weight for ETFs because they are diversified.

---

## 11. Stock Final Score

```
Stock Final Score =
  25% × target allocation gap
+ 20% × quality score
+ 20% × momentum score
+ 15% × value score
+ 10% × volatility/risk score
+ 10% × news score
```

News matters more for individual stocks than broad ETFs.

---

## 12. Final Position-Sizing Algorithm

Starting bucket split (default model):

```
monthly_budget = 4,000 MXN
Core ETF bucket = 70% = 2,800 MXN
Growth bucket = 20% = 800 MXN
Cash bucket = 10% = 400 MXN
```

Process per bucket:

```
For each bucket:
    rank eligible assets by final_score
    allocate more to underweight high-score assets
    allocate zero to blocked/risky assets
    send leftover to cash or core ETF
```

Rules:

1. Broad ETFs always get priority.
2. Individual stocks cannot exceed max allocation.
3. AI news cannot fully override long-term plan.
4. If risk is high, reduce new buys first; do not auto-sell.
5. Unused stock allocation goes to cash or underweight core ETF.
6. Selling requires manual emergency review.

---

## 13. News Modifier Constraints

- News affects **new buys first**, not existing holdings.
- If news confidence < 60, reduce or ignore the news effect.
- Prefer "watch" over "reduce" when uncertain.
- Do not recommend selling broad ETFs based on one headline.
- Example: NVDA reduced from 200 MXN to 100 MXN due to elevated valuation risk; unused 100 MXN moved to cash.

---

## Example Monthly Decision

```
Monthly investment budget: 4,000 MXN

Normal allocation:
- Core ETF bucket: 2,800 MXN
- Growth/tech bucket: 800 MXN
- Cash reserve: 400 MXN

After algorithm and news-risk modifier:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Cash reserve: 500 MXN
```

---

## v1 Exclusions

Do not implement in v1:

- LSTM / neural network price prediction
- Day-trading RSI bots
- Pure news sentiment trading
- Options strategy algorithms
- Automatic broker trading
- Max-Sharpe optimizer without constraints
- Crypto-style signal bots

---

## P2 — Initial Investment Engine

For users with `investment_status = not_invested_yet` and no holdings, a separate engine allocates a **one-time initial lump sum** (from `initial_investment_amount` or default `monthly_investment_amount`).

**Input:** pasted `initial_investment_research` JSON (symbol scores, roles, ai_bias) + watchlist technical scores.

**ETF initial score:**
```
30% user_fit + 25% technical + 20% risk_adjusted + 15% news + 10% diversification
```

**Stock initial score:**
```
25% fundamental + 20% technical + 20% risk_adjusted + 15% news + 10% user_fit + 10% diversification
```

**Allocation rules:**
- Core broad ETFs receive higher weight via role multiplier
- Individual stocks capped at `max_individual_stock_percent` of initial amount
- `ai_bias = avoid` → amount 0, manual review
- `ai_bias = watch` → 50% reduction
- `news_confidence < 60` → dampened news weight
- `overall_risk_level = high` → increased cash reserve
- Unallocated budget after caps flows to CASH line

**Output:** persisted as `monthly_plans` with `plan_kind = initial`, `status = initial_recommendation`.

This is **not** target allocation — it is an engine-generated initial manual recommendation distribution.
