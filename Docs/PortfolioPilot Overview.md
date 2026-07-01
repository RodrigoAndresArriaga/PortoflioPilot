## **Complete Master Context — PortfolioPilot** 

## **1. Product Definition** 

PortfolioPilot is a **multi-user, manual-only long-term investment dashboard** . 

The app helps users decide **exactly how much to invest each month into each ETF, stock, or cash reserve** based on: 

```
- monthly investment amount
- preferred currency
- current holdings
- target allocation
- technical/risk algorithms
- portfolio drift
- manually entered ChatGPT news-risk reports
```

- `long-term investing rules` 

The app does **not** trade automatically. 

The final output is a clear monthly buy plan, such as: 

```
July 2026 Monthly Plan
Invest:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Brokerage cash: 500 MXN
```

The user then manually places the trades in their brokerage account. 

## **2. Strategy Framing** 

The correct strategy is: 

1 

```
Long-term investing
+
Monthly contribution planning
+
Portfolio allocation control
+
Risk-aware rebalancing
+
News-response layer for major events
+
Manual execution
```

It is **not** : 

- `scalping` 

- `day trading` 

- `automatic trading` 

- `AI trading - headline trading` 

- `high-frequency trading` 

- `broker-connected trading bot` 

The system is designed to answer: 

- `How much should I invest this month?` 

- `Which assets are underweight?` 

- `Should I add normally or cautiously?` 

- `Is a stock becoming too risky?` 

- `Should I pause aggressive growth buys?` 

- `Is my portfolio too concentrated?` 

- `Did major news change the risk profile?` 

The system should avoid answering: 

- `Should I buy/sell in the next 5 minutes?` 

- `Should I rotate constantly?` 

- `Should I trade every headline?` 

- `Should ChatGPT control my portfolio?` 

2 

## **3. Original Investment Plan** 

The original personal plan is based on: 

```
Monthly income: 11,000 MXN
```

Full monthly budget split: 

|Bucket|Monthly MXN|%|18-Month Total|
|---|---|---|---|
|Car down-payment fund|4,500|41%|81,000|
|Stocks / ETFs|4,000|36%|72,000|
|Wants fund|1,250|11%|22,500|
|Trips / fun fund|1,250|11%|22,500|
|**Total**|**11,000**|**100%**|**198,000**|



The app focuses mainly on the **Stocks / ETFs bucket** . 

Original investment bucket split: 

|Investment Bucket|% of Investment Bucket|Monthly MXN|
|---|---|---|
|Broad U.S. / global market ETF|70%|2,800|
|Higher-risk growth/tech ETF or individual stocks|20%|800|
|Cash reserve inside brokerage|10%|400|
|**Total**|**100%**|**4,000**|



This becomes the default allocation model for the original user, but other users can customize their monthly investment amount, currency, holdings, and allocation. 

## **4. Core Product Rules** 

The app must enforce these principles: 

`1. Manual trading only.` 

`2. No automatic broker execution.` 

`3. No broker API integration in v1.` 

`4. ChatGPT does not directly decide trades.` 

3 

`5. AI news analysis only modifies risk/new-contribution behavior.` 

`6. Broad ETFs are prioritized over individual stocks.` 

`7. Individual stock exposure is capped.` 

`8. News affects new buys first, not existing holdings.` 

`9. Broad ETFs should not be sold because of one short-term headline.` 

`10. If news confidence is low, reduce or ignore the news effect.` 

`11. Unused growth allocation moves to cash or underweight core ETF.` 

`12. Selling requires manual emergency review.` 

`13. Every user’s data is private and protected with Supabase RLS.` 

## **5. Multi-User App Model** 

The app will support multiple users through **Supabase Auth** . 

Users can sign up with: 

```
- email + password
- Google login later if desired
```

Each user has their own: 

```
- profile
- currency
- monthly investment amount
- risk profile
- time horizon
- portfolio
- holdings
- target allocation
- watchlist
- monthly plans
- news-risk inputs
```

Friends and family can use the app, but their data must remain private and separate. 

For v1: 

```
One user = one private account = one portfolio
```

Later possible features: 

4 

- `family groups - view-only sharing` 

- `invite links` 

- `admin/member roles` 

## **6. Onboarding Flow** 

The onboarding should ask: 

`1. Preferred currency` 

`2. Monthly investment amount` 

`3. Investment day` 

`4. Risk profile` 

`5. Time horizon` 

`6. Current holdings` 

`7. Target allocation` 

`8. Watchlist` 

`9. First monthly plan preview` 

## **Step 1 — Account** 

User signs up or logs in. 

## **Step 2 — Currency and Monthly Amount** 

Fields: 

```
Preferred currency:
- MXN
- USD
- EUR
- CAD
- GBP
- Other
Monthly investment amount:
Example: 4,000 MXN
Investment day:
Default: 1st of every month
```

5 

For the original user: 

```
Currency: MXN
Monthly investment amount: 4,000 MXN
Investment day: 1st of every month
```

## **Step 3 — Investor Profile** 

Fields: 

```
Risk profile:
- Conservative
- Balanced
- Growth
- Aggressive growth
Time horizon:
- 1–3 years
- 3–5 years
- 5–10 years
- 10+ years
```

For the original user: 

```
Risk profile: Growth / balanced-growth
Time horizon: Long-term
```

## **Step 4 — Current Holdings** 

The user enters what they already own. 

Fields: 

```
Ticker symbol
Asset name
Asset type: ETF / stock / cash / crypto / other
Currency
Current value
Cost basis
Shares, optional
Broker, optional
```

6 

Example: 

|Symbol|Type|Current Value|Cost Basis|Currency|
|---|---|---|---|---|
|VOO|ETF|5,000|4,800|MXN|
|QQQ|ETF|2,000|1,900|MXN|
|NVDA|Stock|1,500|1,300|MXN|
|Cash|Cash|400|400|MXN|



Important: 

```
The app needs current value, not only amount invested, because portfolio weights
are based on current market value.
```

## **Step 5 — Target Allocation** 

The user chooses: 

- `Use recommended allocation` 

- `Customize allocation` 

Default model: 

|Bucket|Target|
|---|---|
|Core broad ETF|60–70%|
|Growth ETF / growth exposure|10–20%|
|Individual stocks|10–20%|
|Cash reserve|5–10%|



Original user default: 

|Bucket|Target|
|---|---|
|Core ETF|70%|
|Growth / tech|20%|
|Cash reserve|10%|



7 

## **Step 6 — Watchlist** 

Default watchlist options: 

```
Core ETFs:
- VOO
- VTI
- QQQ
- SCHD
- VXUS
- BND
Growth / tech stocks:
- NVDA
- MSFT
- AAPL
- AMD
- GOOGL
- AMZN
- META
```

Important: 

```
Do not force too many tickers.
More tickers means more noise.
```

## **Step 7 — First Monthly Plan Preview** 

Onboarding ends with a first generated plan: 

```
Based on your monthly amount and current portfolio, your first monthly plan is:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Cash reserve: 500 MXN
```

The user confirms. 

8 

## **7. Monthly Investment Timing** 

The user invests on the **1st of every month** . 

Rule: 

```
Invest on the 1st of every month.
If the 1st is not a trading day, invest on the next trading day.
```

The monthly plan should be generated before the 1st. 

## **8. ChatGPT’s Role** 

ChatGPT is used as a **manual scheduled research/news analyst** , not as an execution engine. 

The user wants to use their ChatGPT subscription instead of OpenAI API. 

Important constraint: 

```
ChatGPT subscription cannot be used programmatically inside the app.
```

So the workflow is manual: 

```
ChatGPT Scheduled Task produces structured market/news report
        ↓
User copies structured output
        ↓
User manually enters values into frontend
        ↓
Frontend combines those values with technical/risk algorithms
        ↓
App generates exact monthly buy amounts
        ↓
User manually trades
```

This avoids OpenAI API costs. 

9 

## **9. Report Cadence** 

The system has three research/report layers: 

`1. Daily urgent-news scan` 

`2. Weekly market review` 

`3. Monthly allocation review` 

Each has a different purpose. 

## **10. Daily Urgent-News Scan** 

Daily reports should only be used if news is urgent or materially relevant. 

They should **not** be used for normal investing decisions. 

Daily urgent news includes: 

- `major market crash or sharp index move` 

- `Fed/rate shock` 

- `inflation/jobs surprise` 

- `earnings collapse` 

- `fraud/lawsuit/regulation risk` 

- `geopolitical shock` 

- `sector crash` 

- `major company-specific event` 

- `material change to long-term investment thesis` 

If nothing urgent happened, ChatGPT should return: 

```
{
"report_type":"daily_urgent_scan",
"report_date":"YYYY-MM-DD",
"urgent_news":false,
"action_required":false,
"summary":"No urgent market-moving news requiring frontend input today."
}
```

If urgent news exists, it returns structured data for manual frontend input. 

10 

## **Daily Task Prompt** 

```
Every weekday after U.S. market close, scan major market and company news for
urgent events affecting this watchlist:
```

```
VOO, VTI, QQQ, SCHD, VXUS, BND, NVDA, MSFT, AAPL, AMD, GOOGL, AMZN, META.
```

```
This is for a long-term investment dashboard, not day trading and not automatic
trading.
```

```
Only report news that is urgent or materially relevant to long-term risk.
```

```
Urgent means:
- major index move
- Fed/rate shock
- inflation/jobs surprise
- earnings collapse
- fraud/lawsuit/regulation risk
- geopolitical shock
- sector crash
- major company-specific event
- material change to long-term investment thesis
```

```
If there is no urgent news, return only:
{
  "report_type": "daily_urgent_scan",
  "report_date": "YYYY-MM-DD",
  "urgent_news": false,
  "action_required": false,
  "summary": "No urgent market-moving news requiring frontend input today."
}
If there is urgent news, return valid JSON only:
{
  "report_type": "daily_urgent_scan",
  "report_date": "YYYY-MM-DD",
  "urgent_news": true,
  "action_required": true,
  "overall_risk_level": "low | medium | high",
  "market_regime": "bullish | neutral | bearish | volatile",
  "events": [
    {
      "symbol": "string",
      "asset_type": "ETF | stock",
```

11 

```
      "event_type": "macro | earnings | regulation | lawsuit | product | sector
| geopolitical | valuation | other",
      "news_direction": "positive | neutral | negative | mixed",
      "news_score": 0,
      "news_confidence": 0,
      "impact_horizon": "short_term | medium_term | long_term",
      "ai_bias": "hold | watch | reduce | avoid",
      "risk_flags": ["string"],
      "one_sentence_reason": "string",
      "source_count": 0
    }
  ],
  "frontend_input_required": true
}
Rules:
- Do not invent news.
- If evidence is weak, set confidence below 60.
- Prefer "watch" over "reduce" when uncertain.
- Do not recommend selling broad ETFs based on one headline.
- Do not output automatic trading instructions.
```

## **11. Weekly Market Review** 

The weekly report is more important than the daily scan. 

Purpose: 

- `summarize the week - identify market regime - detect trend changes` 

- `review sector strength/weakness` 

- `flag assets requiring attention` 

- `decide if next week should be normal, cautious, or defensive` 

Recommended schedule: 

```
Every Friday after market close
```

The weekly report influences: 

12 

```
- risk level
- watchlist status
- whether to pause aggressive buys
- whether any stock needs manual review
```

It should not directly decide final monthly buy amounts. 

## **Weekly Review Prompt** 

```
Every Friday after U.S. market close, produce a weekly market review for this
long-term investment dashboard.
Watchlist:
VOO, VTI, QQQ, SCHD, VXUS, BND, NVDA, MSFT, AAPL, AMD, GOOGL, AMZN, META.
Return valid JSON only.
{
  "report_type": "weekly_market_review",
  "week_ending": "YYYY-MM-DD",
  "market_regime": "bullish | neutral | bearish | volatile",
  "overall_risk_level": "low | medium | high",
  "weekly_summary": "string",
  "next_week_bias": "normal | cautious | defensive",
  "major_events": ["string"],
  "symbols_to_watch": [
    {
      "symbol": "string",
      "reason": "string",
      "risk_level": "low | medium | high",
      "suggested_frontend_status": "normal | watch | reduce_new_buys |
manual_review"
    }
  ],
  "frontend_input_recommended": true
}
Rules:
- Focus on meaningful weekly changes, not noise.
- Do not produce trade instructions.
- Output risk context only.
```

13 

## **12. Monthly Allocation Review** 

The monthly report is the most important report because the user invests on the 1st. 

Purpose: 

- `prepare next month’s investment plan` 

- `summarize the previous month` 

- `identify major market regime changes` 

- `review each watchlist asset` 

- `provide news-risk inputs for the frontend` 

- `support exact monthly buy amount calculation` 

Recommended schedule: 

```
Last trading day of the month
or evening before the 1st monthly investment date
```

This is the report that should usually be copied into the frontend. 

## **Monthly Allocation Review Prompt** 

```
On the last trading day of every month, produce a monthly allocation-support
report for my long-term investment dashboard.
```

```
Watchlist:
VOO, VTI, QQQ, SCHD, VXUS, BND, NVDA, MSFT, AAPL, AMD, GOOGL, AMZN, META.
Purpose:
This report will be manually entered into the frontend. The frontend will
calculate exact monthly buy amounts. The user manually trades.
Return valid JSON only.
{
  "report_type": "monthly_allocation_review",
  "report_month": "YYYY-MM",
  "market_regime": "bullish | neutral | bearish | volatile",
  "overall_risk_level": "low | medium | high",
  "monthly_summary": "string",
  "allocation_bias": "normal | cautious | defensive | risk_on",
  "symbols": [
    {
```

14 

```
      "symbol": "string",
      "asset_type": "ETF | stock",
      "news_direction": "positive | neutral | negative | mixed",
      "news_score": 0,
      "news_confidence": 0,
      "impact_horizon": "short_term | medium_term | long_term",
      "event_type": "macro | earnings | regulation | lawsuit | product | sector
| geopolitical | valuation | other",
      "risk_flags": ["string"],
      "ai_bias": "add | hold | watch | reduce | avoid",
      "one_sentence_reason": "string",
      "source_count": 0
    }
  ],
  "frontend_input_required": true
}
Rules:
- This is for monthly long-term allocation, not short-term trading.
- Do not invent news.
- If a symbol has no meaningful news, mark it neutral.
- Do not recommend selling long-term ETFs from isolated headlines.
- Use "reduce" only for material risk.
- Prefer "watch" when uncertain.
```

## **13. Manual News Input Fields** 

The frontend needs a page where the user manually inputs ChatGPT’s structured output. 

Fields: 

```
symbol
news_score
news_direction
news_confidence
impact_horizon
event_type
risk_flags
ai_bias
summary
source_count
manual_notes
```

15 

Example: 

```
symbol: QQQ
news_score: 68
news_direction: positive
news_confidence: 74
impact_horizon: medium_term
event_type: macro/sector
risk_flags: valuation_risk, rate_sensitivity
ai_bias: hold
source_count: 6
```

## **14. How the App Uses ChatGPT Output** 

ChatGPT output is only a modifier. 

Rules: 

```
IF news_confidence < 60:
    reduce or ignore news impact
IF ai_bias = "hold":
    normal allocation
IF ai_bias = "watch":
    reduce this month’s buy by 50%
IF ai_bias = "reduce":
    do not add this month
IF ai_bias = "avoid":
    do not add this month and flag manual review
IF asset is broad ETF AND impact_horizon = "intraday":
    ignore news modifier
IF ai_bias = "add":
    allow only if technical and risk scores agree
```

Important: 

16 

```
AI news analysis should never fully override long-term allocation math.
```

## **15. Core Algorithms** 

The most reliable programmable algorithms for the app: 

`1. Target allocation algorithm` 

`2. Contribution-based rebalancing` 

`3. Drift-band rebalancing` 

`4. Dollar-cost averaging schedule` 

`5. ETF overlap / diversification check` 

`6. Momentum / relative strength score` 

`7. Trend filter` 

`8. Volatility / drawdown risk score` 

`9. Stock factor score` 

`10. ChatGPT news-risk modifier` 

`11. Final position-sizing algorithm` 

Avoid in v1: 

- `LSTM / neural network price prediction` 

- `day-trading RSI bots` 

- `pure news sentiment trading` 

- `options strategy algorithms` 

- `automatic broker trading` 

- `max-Sharpe optimizer without constraints` 

- `crypto-style signal bots` 

## **16. Target Allocation Algorithm** 

Formula: 

```
portfolio_after_contribution = current_portfolio_value + monthly_contribution
target_value = portfolio_after_contribution × target_weight
```

```
buy_gap = target_value - current_asset_value
```

17 

```
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

## **17. Contribution-Based Rebalancing** 

The app should rebalance using new monthly contributions instead of selling. 

Rules: 

```
If asset is underweight:
    prioritize new monthly buys
If asset is overweight:
    do not buy more this month
If asset is extremely overweight:
    flag for manual rebalance review
```

This keeps the system long-term and reduces unnecessary selling. 

## **18. Drift-Band Rebalancing** 

Use drift bands to avoid overreacting to tiny allocation changes. 

Example: 

```
Target VOO weight: 55%
Allowed drift band: ±5%
```

18 

```
If VOO weight is between 50% and 60%:
```

```
    no rebalance needed
```

```
If VOO weight is below 50%:
    prioritize VOO buys
```

```
If VOO weight is above 60%:
```

```
    stop buying VOO and send review alert
```

## **19. Dollar-Cost Averaging Rule** 

Default behavior: 

```
Invest the planned monthly amount every month.
Do not try to perfectly time the market.
Only adjust new contributions when risk signals are strong.
```

Original user: 

```
Invest 4,000 MXN every month into stocks/ETFs.
```

## **20. ETF Overlap / Concentration Algorithm** 

The app should detect redundant exposure. 

Example: 

```
Do not hold VOO and VTI as major separate core positions unless intentional.
VTI already includes most of the large U.S. companies inside VOO.
```

Other rules: 

```
If user owns QQQ plus many mega-cap tech stocks:
    flag tech concentration
```

```
If user owns multiple S&P 500 ETFs:
```

19 

```
    flag redundancy
```

```
If one stock exceeds max allocation:
    block additional buys unless user overrides
```

## **21. Momentum / Relative Strength Algorithm** 

Momentum score: 

```
Momentum Score =
40% × 12-month return
30% × 6-month return
20% × 3-month return
10% × price above 200-day moving average
```

Use this to tilt new contributions. 

Bad behavior: 

```
QQQ has better 3M momentum, sell everything and buy QQQ.
```

Good behavior: 

```
QQQ has stronger momentum, allocate this month’s growth bucket toward QQQ.
```

## **22. Trend Filter** 

Trend score: 

```
Trend Score =
40% price above 200D moving average
30% price above 50D moving average
30% 50D moving average above 200D moving average
```

Risk behavior: 

20 

```
If broad market trend is negative:
    pause aggressive stock buys
    continue core ETF carefully
    increase cash reserve
```

Do not panic-sell broad ETFs based only on trend deterioration. 

## **23. Volatility / Drawdown Risk Score** 

Risk score: 

```
Risk Score =
35% 90-day volatility
25% 1-year max drawdown
20% beta
20% downside volatility
```

Rules: 

```
If single stock > 10% of portfolio:
    block additional buys unless user overrides
If tech sector > 35%:
    warn sector concentration
If drawdown > 30%:
    require manual review
If volatility is extreme:
    reduce monthly allocation
```

## **24. Stock Factor Score** 

For individual stocks, use factor investing metrics. 

Factors: 

21 

```
Quality
Value
Momentum
Risk / volatility
Growth / fundamentals
```

Stock score: 

```
Stock Score =
25% quality
20% value
20% momentum
20% risk / volatility
15% growth / fundamentals
```

Example metrics: 

|Factor|Metrics|
|---|---|
|Quality|ROE, ROIC, proft margin, debt/equity, free cash fow margin|
|Value|P/E, forward P/E, P/S, EV/EBITDA, free cash fow yield|
|Momentum|3M, 6M, 12M return|
|Risk|30D/90D volatility, beta, max drawdown|
|Growth|revenue growth, EPS growth, free cash fow growth|



## **25. ETF Final Score** 

For ETFs: 

```
ETF Final Score =
35% target allocation gap
25% trend score
20% momentum score
15% volatility/risk score
5% news score
```

News has low weight for ETFs because ETFs are diversified. 

22 

## **26. Stock Final Score** 

For individual stocks: 

```
Stock Final Score =
25% target allocation gap
20% quality score
20% momentum score
15% value score
10% volatility/risk score
10% news score
```

News matters more for individual stocks than broad ETFs. 

## **27. Final Position-Sizing Algorithm** 

Starting example: 

```
monthly_budget = 4,000 MXN
Core ETF bucket = 70% = 2,800 MXN
Growth bucket = 20% = 800 MXN
Cash bucket = 10% = 400 MXN
```

Process: 

```
For each bucket:
    rank eligible assets by final_score
    allocate more to underweight high-score assets
    allocate zero to blocked/risky assets
    send leftover to cash or core ETF
```

Rules: 

`1. Broad ETFs always get priority.` 

`2. Individual stocks cannot exceed max allocation.` 

`3. AI news cannot fully override long-term plan.` 

`4. If risk is high, reduce new buys first; do not auto-sell.` 

23 

`5. Unused stock allocation goes to cash or underweight core ETF.` 

`6. Selling requires manual emergency review.` 

## **28. Example Monthly Decision** 

```
Monthly investment budget: 4,000 MXN
```

```
Normal allocation:
- Core ETF bucket: 2,800 MXN
- Growth/tech bucket: 800 MXN
```

- `Cash reserve: 400 MXN` 

```
After algorithm and news-risk modifier:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Cash reserve: 500 MXN
```

```
Reason:
```

```
NVDA was reduced from 200 MXN to 100 MXN because ChatGPT news input marked it as
“watch” with elevated valuation risk. The unused 100 MXN was moved to cash.
```

## **29. Technical Architecture** 

Recommended stack: 

```
Frontend:
Next.js
UI library:
shadcn/ui
Styling:
Tailwind CSS
Hosting:
Vercel
```

24 

```
Backend:
Next.js API routes / server actions
Database:
Supabase Postgres
Auth:
Supabase Auth
Realtime dashboard:
Supabase Realtime
Email alerts:
Resend or another transactional email provider
AI/news layer:
Manual ChatGPT Scheduled Task output
Trading:
Manual only
```

High-level architecture: 

```
Next.js app on Vercel
        ↓
Supabase Auth
        ↓
Supabase Database
        ↓
User onboarding + holdings + target allocation
        ↓
Technical algorithms + scoring engine
        ↓
Manual ChatGPT news-risk input
        ↓
Monthly buy plan
        ↓
Email alert
        ↓
User manually trades
```

25 

## **30. Email Alerts** 

Telegram was removed. The app uses email. 

Email alerts should include: 

- `monthly buy plan ready` 

- `risk level changed` 

- `urgent-news alert` 

- `weekly risk summary available` 

- `monthly investment reminder` 

- `portfolio concentration warning` 

- `manual review required` 

Example email: 

```
Subject: Monthly Investment Plan Ready — July 2026
Monthly budget: 4,000 MXN
Recommended manual buys:
- VOO: 2,200 MXN
- VXUS: 400 MXN
- SCHD: 200 MXN
- QQQ: 400 MXN
- MSFT: 200 MXN
- NVDA: 100 MXN
- Cash reserve: 500 MXN
Risk note:
NVDA allocation reduced due to elevated valuation risk.
```

```
Action:
Review and manually place trades in your brokerage account.
```

26 

## **31. Database Schema Draft** 

## **profiles** 

## `profiles` 

- `id uuid primary key references auth.users(id)` 

- `full_name text` 

- `base_currency text` 

- `monthly_investment_amount numeric` 

- `investment_day int` 

- `risk_profile text` 

- `time_horizon text` 

- `onboarding_completed boolean` 

- `created_at timestamp` 

## **portfolios** 

## `portfolios` 

- `id uuid primary key` 

- `user_id uuid references auth.users(id)` 

- `name text` 

- `base_currency text` 

- `created_at timestamp` 

## **holdings** 

## `holdings` 

- `id uuid primary key` 

- `user_id uuid references auth.users(id)` 

- `portfolio_id uuid references portfolios(id)` 

- `symbol text` 

- `asset_name text` 

- `asset_type text` 

- `currency text` 

- `shares numeric` 

- `current_value numeric` 

- `cost_basis numeric` 

- `broker text` 

- `created_at timestamp` 

- `updated_at timestamp` 

27 

## **target_allocations** 

```
target_allocations
```

- `id uuid primary key` 

- `user_id uuid references auth.users(id)` 

- `portfolio_id uuid references portfolios(id)` 

- `symbol text` 

- `bucket text` 

- `target_percent numeric` 

- `max_percent numeric` 

- `enabled boolean` 

## **monthly_plans** 

```
monthly_plans
```

- `id uuid primary key` 

- `user_id uuid references auth.users(id)` 

- `portfolio_id uuid references portfolios(id)` 

- `month text` 

- `monthly_amount numeric` 

- `currency text` 

- `status text` 

- `created_at timestamp` 

## **monthly_plan_items** 

```
monthly_plan_items
```

- `id uuid primary key` 

- `monthly_plan_id uuid references monthly_plans(id)` 

- `symbol text` 

- `target_weight numeric` 

- `current_weight numeric` 

- `recommended_amount numeric` 

- `adjusted_amount numeric` 

- `reason text` 

## **manual_news_inputs** 

```
manual_news_inputs
```

- `id uuid primary key` 

- `user_id uuid references auth.users(id)` 

- `symbol text` 

28 

- `report_date date` 

- `report_type text` 

- `news_score numeric` 

- `news_direction text` 

- `news_confidence numeric` 

- `ai_bias text` 

- `impact_horizon text` 

- `event_type text` 

- `risk_flags text[]` 

- `notes text` 

## **32. Security Requirement** 

Every user-owned table must include: 

```
user_id
```

Every user-owned table must have Supabase Row Level Security. 

Example policies: 

```
createpolicy"Users can view own holdings"
onholdings
forselect
using(auth.uid()=user_id);
```

```
createpolicy"Users can insert own holdings"
onholdings
forinsert
withcheck(auth.uid()=user_id);
```

```
createpolicy"Users can update own holdings"
onholdings
forupdate
using(auth.uid()=user_id)
withcheck(auth.uid()=user_id);
```

This is mandatory because the app is intended to be shared with friends and family. 

29 

## **33. Frontend Direction** 

The frontend should be: 

- `simple` 

- `clean` 

- `engaging` 

- `highly visual` 

- `easy to understand` 

- `useful at a glance` 

The user should not feel like they are using a spreadsheet. 

The app should feel like a polished investment command center. 

## **Frontend Library** 

Use: 

- `Next.js` 

- `shadcn/ui` 

- `Tailwind CSS` 

shadcn/ui should be used for: 

- `cards` 

- `buttons` 

- `forms` 

- `tabs` 

- `dialogs` 

- `dropdowns` 

- `tables` 

- `badges` 

- `progress bars` 

- `command menus` 

- `side panels/sheets` 

- `toast notifications` 

30 

## **34. Core Frontend Pages** 

Required pages: 

```
/auth
/onboarding
/dashboard
/holdings
/monthly-plan
/news-input
/settings
```

## **/auth** 

Sign up and log in. 

## **/onboarding** 

Flow: 

`1. Welcome` 

`2. Currency + monthly amount` 

`3. Investment style` 

`4. Current holdings` 

`5. Target allocation` 

`6. Watchlist` 

`7. First monthly plan preview` 

## **/dashboard** 

Shows: 

- `total portfolio value` 

- `monthly investment amount` 

- `next investment date` 

- `current risk level` 

- `market regime` 

- `current allocation chart` 

- `target allocation chart` 

- `portfolio drift` 

31 

- `latest recommended buy plan` 

- `news/risk status` 

## **/holdings** 

User adds and edits: 

- `ticker - shares` 

- `current value` 

- `cost basis - broker - currency` 

## **/monthly-plan** 

Outputs exact monthly buy amounts. 

## **/news-input** 

User enters ChatGPT scheduled report values. 

## **/settings** 

User controls: 

- `monthly amount` 

- `currency` 

- `investment day` 

- `risk profile` 

- `target allocation` 

- `email preferences` 

- `watchlist` 

## **35. Dashboard Visual Design** 

The dashboard should prioritize visual clarity. 

Main visuals: 

32 

`1. Portfolio value card` 

`2. Monthly investment amount card` 

`3. Next investment date card` 

`4. Current risk level badge` 

`5. Market regime badge` 

`6. Current allocation donut chart` 

`7. Target vs current allocation chart` 

`8. Portfolio drift indicators` 

`9. Monthly buy plan cards` 

`10. Watchlist score table` 

`11. News-risk input status` 

`12. Monthly investment completion progress` 

## **Recommended Dashboard Layout** 

- `Top row: - Total portfolio value` 

- `Monthly investment amount` 

- `Next investment date` 

- `Current risk level` 

```
Middle row:
```

- `Current allocation chart` 

- `Target allocation chart` 

- `Portfolio drift chart` 

```
Main section:
```

- `This month’s recommended buy plan` 

```
Bottom section:
```

- `Watchlist signals` 

- `News/risk alerts` 

- `Recent monthly plans` 

## **Allocation Donut Chart** 

Shows current allocation: 

- `core ETF` 

- `growth ETF` 

- `individual stocks` 

33 

```
- cash
- other
```

## **Target vs Current Bar Chart** 

Shows allocation drift: 

```
VOO: current 48%, target 55%
QQQ: current 14%, target 10%
Cash: current 6%, target 10%
```

## **Monthly Buy Plan Cards** 

Each card shows: 

```
- symbol
- amount to invest
- reason
- risk badge
- status
```

Example: 

```
VOO
2,200 MXN
Underweight core allocation
Status: Add normally
```

## **Risk Badge** 

Use: 

```
Low Risk
Medium Risk
High Risk
Manual Review
```

## **Market Regime Badge** 

Use: 

34 

```
Bullish
Neutral
Volatile
Bearish
```

## **Watchlist Table** 

Columns: 

```
Symbol
Type
Current Weight
Target Weight
Technical Score
News Score
Risk
AI Bias
Final Action
```

## **Monthly Plan Summary** 

Shows: 

```
Total to invest: 4,000 MXN
Allocated: 3,500 MXN
Cash reserve: 500 MXN
Manual trades: 6
```

## **36. UX Principles** 

The app should follow these principles: 

`1. The user should understand the monthly plan in under 10 seconds.` 

`2. Exact buy amounts should be the main output.` 

`3. Risk warnings should be obvious but not dramatic.` 

`4. Charts should explain allocation and drift visually.` 

`5. Manual input should be fast.` 

`6. The app should avoid clutter.` 

`7. The dashboard should not feel like a trading terminal.` 

35 

`8. The tone should feel long-term and disciplined.` 

`9. The app should feel more like an investment cockpit than a spreadsheet.` 

## **37. Final Intended Workflow** 

## **Daily Workflow** 

`1. ChatGPT scheduled task runs daily after market close.` 

`2. It only reports urgent/material news.` 

`3. If no urgent news, user does nothing.` 

`4. If urgent news exists, user manually inputs the relevant fields.` 

`5. App updates risk flags.` 

`6. App may email a warning if risk is high.` 

`7. No trade happens automatically.` 

## **Weekly Workflow** 

`1. ChatGPT produces weekly market review on Friday.` 

`2. User reviews market regime and watchlist risks.` 

`3. User inputs only meaningful weekly risk changes.` 

`4. App updates watchlist and portfolio risk context.` 

`5. No automatic trading.` 

## **Monthly Workflow** 

`1. ChatGPT produces monthly allocation-support report near month-end.` 

`2. User updates current holdings.` 

`3. User inputs ChatGPT monthly news-risk values.` 

`4. Frontend calculates allocation gaps, technical scores, risk modifiers, and final monthly buy amounts.` 

`5. App shows a clean visual monthly investment plan.` 

`6. App emails the monthly plan.` 

`7. User manually invests on the 1st or next trading day.` 

`8. User marks the plan as completed.` 

## **Long-Term Workflow** 

`1. User invests monthly.` 

`2. App keeps the portfolio near target allocation.` 

36 

`3. New contributions rebalance underweight assets.` 

`4. Risk/news layer slows down risky additions.` 

`5. User avoids emotional trading.` 

`6. Portfolio compounds over time.` 

## **Instructions Page (New Page)** 

The app includes a dedicated page: 

```
/instructions
```

Purpose: 

- `Help users understand exactly how to use the system` 

- `Show the full workflow clearly` 

- `Provide ready-to-copy ChatGPT prompts` 

- `Automatically personalize prompts using the user’s selected watchlist` 

## **What the Instructions Page Shows** 

`1. Step-by-step explanation of how the app works` 

`2. Visual diagram of the daily, weekly, and monthly workflow` 

`3. Explanation of manual vs automated responsibilities` 

`4. Clear explanation of how ChatGPT fits into the system` 

`5. Copyable prompts for ChatGPT Scheduled Tasks` 

`6. Prompts automatically updated with the user’s watchlist from onboarding` 

## **Personalized ChatGPT Prompts** 

The page dynamically generates prompts like: 

```
Watchlist:
VOO, QQQ, NVDA, MSFT, AAPL
```

And injects them into: 

- `Daily urgent scan prompt` 

- `Weekly market review prompt` 

- `Monthly allocation review prompt` 

37 

So users can: 

`1. Copy the prompt` 

`2. Paste it into ChatGPT Scheduled Tasks` 

`3. Run it automatically without editing symbols manually` 

## **Example User Flow** 

`1. User completes onboarding and selects watchlist` 

`2. User opens /instructions page` 

`3. User copies personalized prompts` 

`4. User pastes prompts into ChatGPT Scheduled Tasks` 

`5. ChatGPT produces structured reports automatically` 

`6. User copies results into the app when needed` 

## **Key Benefit** 

```
Users do not need to understand prompt engineering.
```

```
The system gives them ready-to-use, personalized prompts aligned with their
portfolio.
```

## **38. MVP Build Order** 

## **Phase 1 — Multi-user foundation** 

- `Next.js project` 

- `shadcn/ui setup` 

- `Tailwind setup` 

- `Supabase Auth` 

- `Supabase database` 

- `Profiles table` 

- `RLS policies` 

- `Onboarding flow` 

## **Phase 2 — Portfolio input** 

- `Current holdings page` 

- `Target allocation page` 

- `Watchlist setup` 

38 

```
- Currency setting
```

- `Monthly amount setting` 

## **Phase 3 — Monthly allocation engine** 

- `Target allocation algorithm` 

- `Contribution-based rebalancing` 

- `Drift-band logic` 

- `Exact monthly buy amounts` 

## **Phase 4 — Visual dashboard** 

- `Portfolio value cards` 

- `Allocation donut chart` 

- `Target vs current chart` 

- `Buy plan cards` 

- `Watchlist table` 

- `Risk badges` 

## **Phase 5 — Risk and technical algorithms** 

- `Trend score` 

- `Momentum score` 

- `Volatility score` 

- `Drawdown score` 

- `Concentration warnings` 

- `ETF overlap warnings` 

## **Phase 6 — Manual ChatGPT news layer** 

- `ChatGPT scheduled task prompts` 

- `Daily urgent scan input` 

- `Weekly review input` 

- `Monthly allocation review input` 

- `News modifier logic` 

- `Risk adjustment rules` 

39 

## **Phase 7 — Email alerts** 

- `Monthly plan email` 

- `Urgent risk warning email` 

- `Investment reminder email` 

- `Manual review email` 

## **Phase 8 — Later improvements** 

- `API-based market data` 

- `automatic price updates` 

- `historical backtesting` 

- `currency conversion` 

- `family groups` 

- `view-only sharing` 

- `OpenAI API integration if worth the cost` 

## **39. Final One-Sentence Product Definition** 

PortfolioPilot is a **multi-user, manual-only long-term investment dashboard built with Next.js, Supabase, shadcn/ui, and Tailwind CSS that uses monthly contribution planning, current holdings, target allocation, technical/risk algorithms, and manually entered ChatGPT daily-urgent, weekly, and monthly news-risk reports to generate exact monthly buy amounts with clear visual dashboards and email alerts.** 

40 

