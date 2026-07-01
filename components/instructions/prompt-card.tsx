import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CopyPromptButton } from "./copy-prompt-button";

type PromptCardProps = {
  title: string;
  schedule: string;
  description: string;
  prompt: string;
  copyDisabled?: boolean;
};

export function PromptCard({
  title,
  schedule,
  description,
  prompt,
  copyDisabled,
}: PromptCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <CopyPromptButton text={prompt} disabled={copyDisabled} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="secondary">{schedule}</Badge>
        <pre className="max-h-96 overflow-auto rounded-lg bg-muted/50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {prompt || "Add symbols to your watchlist to generate this prompt."}
        </pre>
      </CardContent>
    </Card>
  );
}
