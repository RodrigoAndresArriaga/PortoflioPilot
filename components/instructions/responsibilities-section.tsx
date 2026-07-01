import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResponsibilitiesSection() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Manual vs automated responsibilities
        </h3>
        <p className="text-sm text-muted-foreground">
          PortfolioPilot never connects to your brokerage or ChatGPT. Automation
          stays on your side of the workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>You do manually</CardTitle>
            <CardDescription>Actions only you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Create ChatGPT Scheduled Tasks and paste these prompts</li>
              <li>Copy ChatGPT JSON output when a report requires action</li>
              <li>Update holdings and watchlist as your portfolio changes</li>
              <li>Place every buy or sell in your brokerage account</li>
              <li>Decide whether urgent news warrants a portfolio response</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PortfolioPilot does</CardTitle>
            <CardDescription>What the app handles for you</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Fetch market prices and compute portfolio value</li>
              <li>Calculate allocation drift and monthly buy amounts</li>
              <li>Apply technical and risk rules to contribution sizing</li>
              <li>Display dashboards, warnings, and monthly plan summaries</li>
              <li>Keep your data private with per-user Supabase access</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
