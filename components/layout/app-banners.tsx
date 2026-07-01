import type { Profile } from "@/types/database";
import type { PortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";

import { SetupAttentionBanner } from "./setup-attention-banner";
import { TransitionBanner } from "./transition-banner";

type AppBannersProps = {
  profile: Profile;
  lifecycle: PortfolioLifecycleSnapshot | null;
};

export function AppBanners({ profile, lifecycle }: AppBannersProps) {
  if (lifecycle?.transition.shouldShow) {
    return <TransitionBanner lifecycle={lifecycle} />;
  }

  if (lifecycle?.setupAttention.shouldShow) {
    return (
      <SetupAttentionBanner
        profile={profile}
        holdingsCount={lifecycle.holdingsCount}
      />
    );
  }

  if (!lifecycle && profile.setup_attention_dismissed === false) {
    return <SetupAttentionBanner profile={profile} holdingsCount={0} />;
  }

  return null;
}
