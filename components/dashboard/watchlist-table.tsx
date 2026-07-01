import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WatchlistItem } from "@/types/database";

const BUCKET_LABELS: Record<string, string> = {
  core_etf: "Core ETF",
  growth: "Growth",
};

type WatchlistTableProps = {
  watchlist: WatchlistItem[];
};

export function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const enabledItems = watchlist
    .filter((item) => item.enabled)
    .sort((left, right) => left.sort_order - right.sort_order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>
          Symbols you are tracking for future allocation decisions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enabledItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No watchlist items yet. Add symbols in settings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Symbol</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 font-medium">Bucket</th>
                </tr>
              </thead>
              <tbody>
                {enabledItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">
                      {item.symbol.trim().toUpperCase()}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {item.asset_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 uppercase text-muted-foreground">
                      {item.asset_type ?? "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {item.bucket ? (BUCKET_LABELS[item.bucket] ?? item.bucket) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
