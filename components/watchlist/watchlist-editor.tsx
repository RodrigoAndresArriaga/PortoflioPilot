"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { WatchlistStep } from "@/components/onboarding/steps/watchlist-step";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { upsertWatchlist } from "@/lib/server/watchlist";
import {
  formatZodErrors,
  type HoldingInput,
  type WatchlistItemInput,
} from "@/lib/validation/onboarding";
import { upsertWatchlistSchema } from "@/lib/validation/watchlist";

type WatchlistEditorProps = {
  initialWatchlist: WatchlistItemInput[];
  holdings: HoldingInput[];
};

export function WatchlistEditor({
  initialWatchlist,
  holdings,
}: WatchlistEditorProps) {
  const router = useRouter();
  const [watchlist, setWatchlist] =
    useState<WatchlistItemInput[]>(initialWatchlist);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    setSubmitError(null);

    const parsed = upsertWatchlistSchema.safeParse({ watchlist });
    if (!parsed.success) {
      setErrors(formatZodErrors(parsed.error));
      return;
    }

    setIsSaving(true);
    const result = await upsertWatchlist(parsed.data);
    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <WatchlistStep
        value={watchlist}
        holdings={holdings}
        onChange={setWatchlist}
        errors={errors}
      />

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving || watchlist.length === 0}
      >
        {isSaving ? "Saving..." : "Save watchlist"}
      </Button>
    </div>
  );
}
