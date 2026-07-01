import { WatchlistEditor } from "@/components/watchlist/watchlist-editor";
import type { HoldingInput } from "@/lib/validation/holdings";
import type { WatchlistItemInput } from "@/lib/validation/watchlist";

import { SettingsSection } from "./settings-section";

type WatchlistSectionProps = {
  initialItems: WatchlistItemInput[];
  holdings: HoldingInput[];
};

export function WatchlistSection({
  initialItems,
  holdings,
}: WatchlistSectionProps) {
  return (
    <SettingsSection
      id="watchlist"
      title="Watchlist"
      description="Symbols you want to track for news and risk signals."
    >
      <WatchlistEditor initialWatchlist={initialItems} holdings={holdings} />
    </SettingsSection>
  );
}
