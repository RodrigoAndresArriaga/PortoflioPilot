"use client";

import { Button } from "@/components/ui/button";
import type { Holding } from "@/types/database";

import { HoldingForm } from "./holding-form";
import { HoldingValueEditor } from "./holding-value-editor";
import type { HoldingInput } from "@/lib/validation/holdings";

type HoldingsListProps = {
  holdings: Holding[];
  editingId: string | null;
  editForm: HoldingInput | null;
  onStartEdit: (holding: Holding) => void;
  onEditChange: (value: HoldingInput) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onValueUpdated: () => void;
  isSavingEdit?: boolean;
  editErrors?: Record<string, string>;
  isDeletingId?: string | null;
};

function holdingToInput(holding: Holding): HoldingInput {
  return {
    symbol: holding.symbol,
    asset_name: holding.asset_name,
    asset_type: holding.asset_type,
    currency: holding.currency as HoldingInput["currency"],
    current_value: holding.current_value,
    cost_basis: holding.cost_basis,
    shares: holding.shares,
    broker: holding.broker,
  };
}

export function HoldingsList({
  holdings,
  editingId,
  editForm,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onValueUpdated,
  isSavingEdit = false,
  editErrors,
  isDeletingId,
}: HoldingsListProps) {
  if (holdings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No holdings yet. Add your first position below.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {holdings.map((holding) => (
        <div
          key={holding.id}
          className="space-y-3 rounded-lg border border-input p-4"
        >
          {editingId === holding.id && editForm ? (
            <HoldingForm
              value={editForm}
              baseCurrency={holding.currency}
              onChange={onEditChange}
              onSubmit={onSaveEdit}
              onCancel={onCancelEdit}
              submitLabel="Save changes"
              isSubmitting={isSavingEdit}
              errors={editErrors}
              idPrefix={`edit-${holding.id}`}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{holding.symbol}</p>
                  {holding.asset_name && (
                    <p className="text-sm text-muted-foreground">
                      {holding.asset_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onStartEdit(holding)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(holding.id)}
                    disabled={isDeletingId === holding.id}
                  >
                    {isDeletingId === holding.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  {holding.asset_type}
                </div>
                <div>
                  <span className="text-muted-foreground">Current value: </span>
                  <HoldingValueEditor
                    key={`${holding.id}-${holding.current_value}`}
                    holdingId={holding.id}
                    currentValue={holding.current_value}
                    currency={holding.currency}
                    onUpdated={onValueUpdated}
                  />
                </div>
                {holding.cost_basis != null && (
                  <div>
                    <span className="text-muted-foreground">Cost basis: </span>
                    {holding.cost_basis.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {holding.currency}
                  </div>
                )}
                {holding.broker && (
                  <div>
                    <span className="text-muted-foreground">Broker: </span>
                    {holding.broker}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export { holdingToInput };
