import Link from "next/link";
import { InfoIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { HowItWorksSection } from "./how-it-works-section";
import { PromptCard } from "./prompt-card";
import { ResponsibilitiesSection } from "./responsibilities-section";
import { WorkflowSection } from "./workflow-section";

type InstructionsContentProps = {
  symbols: string[];
  dailyPrompt: string;
  weeklyPrompt: string;
  monthlyPrompt: string;
};

export function InstructionsContent({
  symbols,
  dailyPrompt,
  weeklyPrompt,
  monthlyPrompt,
}: InstructionsContentProps) {
  const hasWatchlist = symbols.length > 0;

  return (
    <div className="space-y-10">
      <Alert>
        <InfoIcon />
        <AlertTitle>Manual-only workflow</AlertTitle>
        <AlertDescription>
          PortfolioPilot does not connect to ChatGPT or your brokerage. Copy
          these prompts into ChatGPT Scheduled Tasks yourself, then paste report
          output back into the app when needed.
        </AlertDescription>
      </Alert>

      {!hasWatchlist && (
        <Alert variant="destructive">
          <InfoIcon />
          <AlertTitle>Watchlist required</AlertTitle>
          <AlertDescription>
            Add at least one enabled symbol on your{" "}
            <Link
              href="/settings/watchlist"
              className="font-medium underline underline-offset-4"
            >
              watchlist settings
            </Link>{" "}
            page to generate personalized prompts.
          </AlertDescription>
        </Alert>
      )}

      <HowItWorksSection />
      <ResponsibilitiesSection />

      <section className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Daily urgent scan workflow
          </h3>
          <p className="text-sm text-muted-foreground">
            Use only when news is urgent or materially relevant. Ignore
            no-action daily reports.
          </p>
        </div>

        <WorkflowSection
          title="Daily urgent scan"
          schedule="Every weekday after U.S. market close"
          purpose="Catch market-moving events that may require risk input — not for normal investing decisions."
          steps={[
            "ChatGPT runs your daily scheduled task after the market closes.",
            "If urgent_news is false, do nothing.",
            <>
              If urgent news exists, review the JSON and paste it on the{" "}
              <Link
                href="/news-input"
                className="font-medium underline underline-offset-4"
              >
                news input page
              </Link>
              .
            </>,
            "No trades happen automatically.",
          ]}
          outputNote="Daily scans should return a minimal no-action JSON payload when nothing urgent occurred."
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Weekly market review workflow
          </h3>
          <p className="text-sm text-muted-foreground">
            Summarize the week, identify regime shifts, and flag symbols needing
            attention.
          </p>
        </div>

        <WorkflowSection
          title="Weekly market review"
          schedule="Every Friday after U.S. market close"
          purpose="Update risk context for the watchlist without deciding final monthly buy amounts."
          steps={[
            "ChatGPT produces a weekly_market_review JSON report.",
            "Review market_regime, overall_risk_level, and symbols_to_watch.",
            <>
              Input meaningful weekly risk changes on the{" "}
              <Link
                href="/news-input"
                className="font-medium underline underline-offset-4"
              >
                news input page
              </Link>
              .
            </>,
            "Use the context to decide if next week should feel normal, cautious, or defensive.",
          ]}
          outputNote="Weekly output provides risk context only — not trade instructions."
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Monthly allocation review workflow
          </h3>
          <p className="text-sm text-muted-foreground">
            The most important report — prepare inputs before your monthly
            investment date.
          </p>
        </div>

        <WorkflowSection
          title="Monthly allocation review"
          schedule="Last trading day of the month, or the evening before your investment date"
          purpose="Support next month's buy plan with news-risk inputs for each watchlist symbol."
          steps={[
            "Update current holdings in PortfolioPilot.",
            "ChatGPT produces a monthly_allocation_review JSON report.",
            <>
              Copy the monthly JSON report into the{" "}
              <Link
                href="/news-input"
                className="font-medium underline underline-offset-4"
              >
                news input page
              </Link>
              .
            </>,
            "Review the monthly plan on the dashboard and invest manually on the 1st or next trading day.",
          ]}
          outputNote="This report is the one you will usually paste on the news input page."
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Copyable personalized prompts
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasWatchlist
              ? `Prompts include your watchlist: ${symbols.join(", ")}`
              : "Prompts will include your watchlist once symbols are configured."}
          </p>
        </div>

        <div className="space-y-4">
          <PromptCard
            title="Daily urgent scan"
            schedule="Weekdays after U.S. market close"
            description="Only report urgent or materially relevant news for your watchlist."
            prompt={dailyPrompt}
            copyDisabled={!hasWatchlist}
          />
          <PromptCard
            title="Weekly market review"
            schedule="Fridays after U.S. market close"
            description="Weekly regime and risk context for your watchlist."
            prompt={weeklyPrompt}
            copyDisabled={!hasWatchlist}
          />
          <PromptCard
            title="Monthly allocation review"
            schedule="Last trading day of each month"
            description="Monthly news-risk inputs to support your buy plan."
            prompt={monthlyPrompt}
            copyDisabled={!hasWatchlist}
          />
        </div>
      </section>
    </div>
  );
}
