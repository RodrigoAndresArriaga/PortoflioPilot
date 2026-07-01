"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateHolding } from "@/lib/server/holdings";

type HoldingValueEditorProps = {
  holdingId: string;
  currentValue: number;
  currency: string;
  onUpdated: () => void;
};

export function HoldingValueEditor({
  holdingId,
  currentValue,
  currency,
  onUpdated,
}: HoldingValueEditorProps) {
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const result = await updateHolding({
      id: holdingId,
      current_value: value,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setIsEditing(false);
    onUpdated();
  }

  function handleCancel() {
    setValue(currentValue);
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {currentValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {currency}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(event) => setValue(event.target.valueAsNumber || 0)}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground">{currency}</span>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
