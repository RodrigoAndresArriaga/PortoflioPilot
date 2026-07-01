import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          K1 scaffold
        </span>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            PortfolioPilot
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            A multi-user, manual-only long-term investment dashboard that
            generates exact monthly buy amounts from your holdings, target
            allocation, and risk signals.
          </p>
        </div>

        <Button>Get started</Button>
      </main>
    </div>
  );
}
