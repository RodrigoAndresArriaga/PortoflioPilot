import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WorkflowSectionProps = {
  title: string;
  schedule: string;
  purpose: string;
  steps: ReactNode[];
  outputNote: string;
};

export function WorkflowSection({
  title,
  schedule,
  purpose,
  steps,
  outputNote,
}: WorkflowSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{purpose}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-foreground">{schedule}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">{outputNote}</p>
      </CardContent>
    </Card>
  );
}
