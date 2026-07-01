export type AssetType = "etf" | "stock" | "cash" | "crypto" | "other";

export type WatchlistAssetType = "etf" | "stock";

export type WatchlistBucket = "core_etf" | "growth";

export type InvestmentStatus =
  | "unknown"
  | "not_invested_yet"
  | "has_investments";

export type Profile = {
  id: string;
  full_name: string | null;
  base_currency: string;
  monthly_investment_amount: number;
  investment_day: number;
  risk_profile: string;
  time_horizon: string;
  investment_status: InvestmentStatus;
  initial_investment_amount: number | null;
  setup_attention_dismissed: boolean;
  broad_etf_priority: boolean;
  cash_reserve_percent: number;
  max_individual_stock_percent: number;
  onboarding_completed: boolean;
  email_alerts_enabled: boolean;
  email_monthly_plan_ready: boolean;
  email_urgent_risk: boolean;
  email_weekly_summary: boolean;
  email_investment_reminder: boolean;
  email_concentration_warning: boolean;
  email_manual_review: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailNotificationLog = {
  id: string;
  user_id: string;
  alert_type: string;
  dedup_key: string;
  sent_at: string;
};

export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  base_currency: string;
  created_at: string;
  updated_at: string;
};

export type Holding = {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  asset_name: string | null;
  asset_type: AssetType;
  currency: string;
  shares: number | null;
  current_value: number;
  last_price: number | null;
  last_price_at: string | null;
  price_source: string | null;
  cost_basis: number | null;
  broker: string | null;
  created_at: string;
  updated_at: string;
};

export type SymbolMarketCache = {
  symbol: string;
  latest_price: number | null;
  currency: string;
  quoted_at: string | null;
  history_json: unknown;
  history_fetched_at: string | null;
  updated_at: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  symbol: string;
  asset_name: string | null;
  asset_type: WatchlistAssetType | null;
  bucket: WatchlistBucket | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MonthlyPlanStatus =
  | "draft"
  | "confirmed"
  | "completed"
  | "initial_recommendation"
  | "manual_review";

export type MonthlyPlanKind = "monthly" | "initial";

export type MonthlyPlan = {
  id: string;
  user_id: string;
  portfolio_id: string;
  month: string;
  monthly_amount: number;
  currency: string;
  status: MonthlyPlanStatus;
  plan_kind: MonthlyPlanKind;
  created_at: string;
  updated_at: string;
};

export type MonthlyPlanItem = {
  id: string;
  monthly_plan_id: string;
  symbol: string;
  recommendation_score: number | null;
  technical_score: number | null;
  news_modifier_score: number | null;
  risk_score: number | null;
  concentration_flag: boolean;
  manual_review_required: boolean;
  decision_basis: string | null;
  recommended_amount: number;
  adjusted_amount: number;
  reason: string;
  created_at: string;
};

export type MonthlyPlanWithItems = {
  plan: MonthlyPlan;
  items: MonthlyPlanItem[];
};

export type NewsReportType =
  | "daily_urgent_scan"
  | "weekly_market_review"
  | "monthly_allocation_review";

export type ManualNewsInput = {
  id: string;
  user_id: string;
  portfolio_id: string;
  parent_id: string | null;
  is_report_header: boolean;
  report_type: NewsReportType;
  report_period: string;
  payload: unknown | null;
  symbol: string | null;
  asset_type: "etf" | "stock" | null;
  news_score: number | null;
  news_direction: "positive" | "neutral" | "negative" | "mixed" | null;
  news_confidence: number | null;
  ai_bias: "add" | "hold" | "watch" | "reduce" | "avoid" | null;
  impact_horizon: "short_term" | "medium_term" | "long_term" | null;
  event_type: string | null;
  risk_flags: string[] | null;
  one_sentence_reason: string | null;
  source_count: number | null;
  reason: string | null;
  risk_level: "low" | "medium" | "high" | null;
  suggested_frontend_status:
    | "normal"
    | "watch"
    | "reduce_new_buys"
    | "manual_review"
    | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<
  Profile,
  "created_at" | "updated_at"
> & {
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;

export type PortfolioInsert = Omit<
  Portfolio,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PortfolioUpdate = Partial<
  Omit<Portfolio, "id" | "user_id" | "created_at" | "updated_at">
>;

export type HoldingInsert = Omit<
  Holding,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type HoldingUpdate = Partial<
  Omit<Holding, "id" | "user_id" | "created_at" | "updated_at">
>;

export type WatchlistItemInsert = Omit<
  WatchlistItem,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WatchlistItemUpdate = Partial<
  Omit<WatchlistItem, "id" | "user_id" | "created_at" | "updated_at">
>;

export type MonthlyPlanInsert = Omit<
  MonthlyPlan,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MonthlyPlanUpdate = Partial<
  Omit<MonthlyPlan, "id" | "user_id" | "created_at" | "updated_at">
>;

export type MonthlyPlanItemInsert = Omit<
  MonthlyPlanItem,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type MonthlyPlanItemUpdate = Partial<
  Omit<MonthlyPlanItem, "id" | "monthly_plan_id" | "created_at">
>;

export type InitialRecommendationReport = {
  id: string;
  user_id: string;
  portfolio_id: string;
  report_date: string;
  report_type: string;
  user_currency: string;
  monthly_investment_amount: number | null;
  initial_investment_amount: number | null;
  risk_profile: string | null;
  time_horizon: string | null;
  market_regime: string | null;
  overall_risk_level: string | null;
  summary: string | null;
  payload_jsonb: unknown;
  created_at: string;
};

export type InitialRecommendationItem = {
  id: string;
  user_id: string;
  portfolio_id: string;
  report_id: string;
  symbol: string;
  asset_name: string | null;
  asset_type: string;
  suggested_role: string | null;
  recommendation_direction: string | null;
  ai_bias: string | null;
  news_direction: string | null;
  fundamental_score: number | null;
  news_score: number | null;
  news_confidence: number | null;
  risk_score: number | null;
  valuation_risk: string | null;
  event_type: string | null;
  impact_horizon: string | null;
  risk_flags: string[];
  source_count: number;
  one_sentence_reason: string | null;
  manual_notes: string | null;
  created_at: string;
};

export type InitialRecommendationReportInsert = Omit<
  InitialRecommendationReport,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type InitialRecommendationItemInsert = Omit<
  InitialRecommendationItem,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type ManualNewsInputInsert = Omit<
  ManualNewsInput,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ManualNewsInputUpdate = Partial<
  Omit<ManualNewsInput, "id" | "user_id" | "created_at" | "updated_at">
>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      portfolios: {
        Row: Portfolio;
        Insert: PortfolioInsert;
        Update: PortfolioUpdate;
      };
      holdings: {
        Row: Holding;
        Insert: HoldingInsert;
        Update: HoldingUpdate;
      };
      watchlist_items: {
        Row: WatchlistItem;
        Insert: WatchlistItemInsert;
        Update: WatchlistItemUpdate;
      };
      monthly_plans: {
        Row: MonthlyPlan;
        Insert: MonthlyPlanInsert;
        Update: MonthlyPlanUpdate;
      };
      monthly_plan_items: {
        Row: MonthlyPlanItem;
        Insert: MonthlyPlanItemInsert;
        Update: MonthlyPlanItemUpdate;
      };
      symbol_market_cache: {
        Row: SymbolMarketCache;
        Insert: Omit<SymbolMarketCache, "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<SymbolMarketCache, "symbol">>;
      };
      manual_news_inputs: {
        Row: ManualNewsInput;
        Insert: ManualNewsInputInsert;
        Update: ManualNewsInputUpdate;
      };
      initial_recommendation_reports: {
        Row: InitialRecommendationReport;
        Insert: InitialRecommendationReportInsert;
        Update: Partial<
          Omit<InitialRecommendationReport, "id" | "user_id" | "created_at">
        >;
      };
      initial_recommendation_items: {
        Row: InitialRecommendationItem;
        Insert: InitialRecommendationItemInsert;
        Update: Partial<
          Omit<
            InitialRecommendationItem,
            "id" | "user_id" | "report_id" | "created_at"
          >
        >;
      };
    };
  };
};
