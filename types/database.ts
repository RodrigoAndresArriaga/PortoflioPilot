export type AssetType = "etf" | "stock" | "cash" | "crypto" | "other";

export type AllocationBucket =
  | "core_etf"
  | "growth"
  | "individual_stock"
  | "cash";

export type WatchlistAssetType = "etf" | "stock";

export type WatchlistBucket = "core_etf" | "growth";

export type Profile = {
  id: string;
  full_name: string | null;
  base_currency: string;
  monthly_investment_amount: number;
  investment_day: number;
  risk_profile: string;
  time_horizon: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type AllocationMode = "auto" | "bucket" | "symbol";

export type TargetBucketKey =
  | "core_etf"
  | "growth_tech"
  | "cash_reserve"
  | "individual_stock";

export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  base_currency: string;
  allocation_mode: AllocationMode;
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

export type TargetAllocation = {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  bucket: AllocationBucket;
  target_percent: number;
  max_percent: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type TargetBucket = {
  id: string;
  user_id: string;
  portfolio_id: string;
  bucket_key: TargetBucketKey;
  target_percent: number;
  min_percent: number | null;
  max_percent: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type TargetAsset = {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  bucket_key: TargetBucketKey;
  target_percent: number | null;
  max_percent: number | null;
  enabled: boolean;
  created_at: string;
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

export type MonthlyPlanStatus = "draft" | "confirmed" | "completed";

export type MonthlyPlan = {
  id: string;
  user_id: string;
  portfolio_id: string;
  month: string;
  monthly_amount: number;
  currency: string;
  status: MonthlyPlanStatus;
  created_at: string;
  updated_at: string;
};

export type MonthlyPlanItem = {
  id: string;
  monthly_plan_id: string;
  symbol: string;
  target_weight: number;
  current_weight: number;
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

export type TargetAllocationInsert = Omit<
  TargetAllocation,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TargetAllocationUpdate = Partial<
  Omit<TargetAllocation, "id" | "user_id" | "created_at" | "updated_at">
>;

export type TargetBucketInsert = Omit<
  TargetBucket,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TargetBucketUpdate = Partial<
  Omit<TargetBucket, "id" | "user_id" | "created_at" | "updated_at">
>;

export type TargetAssetInsert = Omit<
  TargetAsset,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TargetAssetUpdate = Partial<
  Omit<TargetAsset, "id" | "user_id" | "created_at" | "updated_at">
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
      target_allocations: {
        Row: TargetAllocation;
        Insert: TargetAllocationInsert;
        Update: TargetAllocationUpdate;
      };
      target_buckets: {
        Row: TargetBucket;
        Insert: TargetBucketInsert;
        Update: TargetBucketUpdate;
      };
      target_assets: {
        Row: TargetAsset;
        Insert: TargetAssetInsert;
        Update: TargetAssetUpdate;
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
    };
  };
};
