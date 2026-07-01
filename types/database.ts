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
  cost_basis: number | null;
  broker: string | null;
  created_at: string;
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
    };
  };
};
