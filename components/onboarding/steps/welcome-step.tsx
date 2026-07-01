"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WelcomeStepProps = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to PortfolioPilot</CardTitle>
        <CardDescription>
          Set up your profile, portfolio, target allocation, and watchlist in
          a few steps. This takes about five minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>Currency and monthly investment amount</li>
          <li>Risk profile and time horizon</li>
          <li>Current holdings and target allocation</li>
          <li>Watchlist for monitoring</li>
        </ul>
        <Button type="button" onClick={onContinue} className="w-full">
          Get started
        </Button>
      </CardContent>
    </Card>
  );
}
