import type { SettingsPageData } from "@/lib/server/settings";

import { EmailPreferencesForm } from "./email-preferences-form";
import { ProfileSettingsForm } from "./profile-settings-form";
import { SettingsAnchorNav } from "./settings-anchor-nav";
import { SettingsSection } from "./settings-section";
import { StrategySection } from "./strategy-section";
import { WatchlistSection } from "./watchlist-section";

type SettingsPageContentProps = SettingsPageData;

export function SettingsPageContent({
  profile,
  email,
  emailPreferences,
  watchlist,
}: SettingsPageContentProps) {
  return (
    <div className="space-y-10">
      <SettingsAnchorNav />

      <ProfileSettingsForm profile={profile} email={email} />

      <StrategySection profile={profile} />

      <WatchlistSection
        initialItems={watchlist.initialItems}
        holdings={watchlist.holdings}
      />

      <SettingsSection
        id="email"
        title="Email preferences"
        description="Choose which alerts PortfolioPilot sends you."
      >
        <EmailPreferencesForm
          initialPreferences={emailPreferences}
          email={email}
        />
      </SettingsSection>
    </div>
  );
}
