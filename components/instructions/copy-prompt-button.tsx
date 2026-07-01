"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyPromptButtonProps = {
  text: string;
  disabled?: boolean;
};

export function CopyPromptButton({ text, disabled }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text || disabled) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={disabled || !text}
    >
      {copied ? (
        <>
          <CheckIcon />
          Copied
        </>
      ) : (
        <>
          <CopyIcon />
          Copy prompt
        </>
      )}
    </Button>
  );
}
