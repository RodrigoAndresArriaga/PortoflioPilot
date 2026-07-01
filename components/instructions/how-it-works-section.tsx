import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HowItWorksSection() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          How PortfolioPilot works
        </h3>
        <p className="text-sm text-muted-foreground">
          PortfolioPilot is a long-term investing cockpit. You maintain holdings
          and a watchlist; the recommendation engine ranks buy opportunities and
          monthly amounts. You execute every trade manually in your brokerage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>End-to-end flow</CardTitle>
          <CardDescription>
            ChatGPT provides research context. PortfolioPilot applies recommendation
            scoring and risk rules. You stay in control of execution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Set up holdings, strategy preferences, and your{" "}
              <Link
                href="/settings/watchlist"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                watchlist
              </Link>
              .
            </li>
            <li>
              Run ChatGPT Scheduled Tasks using the personalized prompts below.
            </li>
            <li>
              When a report matters, copy its JSON output into PortfolioPilot
              (news input coming in a future update).
            </li>
            <li>
              Review your{" "}
              <Link
                href="/monthly-plan"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                monthly plan
              </Link>{" "}
              on the{" "}
              <Link
                href="/dashboard"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                dashboard
              </Link>
              .
            </li>
            <li>Place trades manually on your investment date.</li>
          </ol>

          <pre className="rounded-lg bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
            {`ChatGPT Scheduled Task → structured JSON report
        ↓
You copy output manually
        ↓
PortfolioPilot applies allocation + risk rules
        ↓
Monthly buy plan on dashboard
        ↓
You trade manually in your brokerage`}
          </pre>
        </CardContent>
      </Card>
    </section>
  );
}
