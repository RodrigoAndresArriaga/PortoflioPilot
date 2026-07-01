"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createHolding,
  deleteHolding,
  updateHolding,
} from "@/lib/server/holdings";
import { refreshPortfolioPrices } from "@/lib/server/market-data/actions";
import { formatZodErrors } from "@/lib/validation/onboarding";
import {
  createHoldingSchema,
  updateHoldingSchema,
  type HoldingInput,
} from "@/lib/validation/holdings";
import type { Holding } from "@/types/database";

import {
  createEmptyHolding,
  HoldingForm,
} from "./holding-form";
import { holdingToInput, HoldingsList } from "./holdings-list";

type HoldingsManagerProps = {
  initialHoldings: Holding[];
  baseCurrency: string;
};

export function HoldingsManager({
  initialHoldings,
  baseCurrency,
}: HoldingsManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(initialHoldings.length === 0);
  const [newHolding, setNewHolding] = useState<HoldingInput>(() =>
    createEmptyHolding(baseCurrency),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<HoldingInput | null>(null);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalValue = initialHoldings.reduce(
    (sum, holding) => sum + holding.current_value,
    0,
  );

  function refresh() {
    router.refresh();
  }

  async function handleRefreshPrices() {
    setFormError(null);
    setIsRefreshing(true);
    const result = await refreshPortfolioPrices();
    setIsRefreshing(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    refresh();
  }

  async function handleAdd() {
    setAddErrors({});
    setFormError(null);

    const parsed = createHoldingSchema.safeParse(newHolding);
    if (!parsed.success) {
      setAddErrors(formatZodErrors(parsed.error));
      return;
    }

    setIsAdding(true);
    const result = await createHolding(parsed.data);
    setIsAdding(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setNewHolding(createEmptyHolding(baseCurrency));
    setShowAddForm(false);
    refresh();
  }

  function handleStartEdit(holding: Holding) {
    setEditingId(holding.id);
    setEditForm(holdingToInput(holding));
    setEditErrors({});
    setFormError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditErrors({});
  }

  async function handleSaveEdit() {
    if (!editingId || !editForm) {
      return;
    }

    setEditErrors({});
    setFormError(null);

    const parsed = updateHoldingSchema.safeParse({
      id: editingId,
      ...editForm,
    });
    if (!parsed.success) {
      setEditErrors(formatZodErrors(parsed.error));
      return;
    }

    setIsSavingEdit(true);
    const result = await updateHolding(parsed.data);
    setIsSavingEdit(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setEditingId(null);
    setEditForm(null);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this holding?")) {
      return;
    }

    setFormError(null);
    setDeletingId(id);
    const result = await deleteHolding(id);
    setDeletingId(null);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    if (editingId === id) {
      handleCancelEdit();
    }
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Total value:{" "}
          {totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {baseCurrency}
        </Badge>
        <Badge variant="secondary">
          {initialHoldings.length} holding
          {initialHoldings.length === 1 ? "" : "s"}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefreshPrices}
          disabled={isRefreshing || initialHoldings.length === 0}
        >
          {isRefreshing ? "Refreshing..." : "Refresh prices"}
        </Button>
      </div>

      <HoldingsList
        holdings={initialHoldings}
        editingId={editingId}
        editForm={editForm}
        onStartEdit={handleStartEdit}
        onEditChange={setEditForm}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDelete={handleDelete}
        onValueUpdated={refresh}
        isSavingEdit={isSavingEdit}
        editErrors={editErrors}
        isDeletingId={deletingId}
      />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add holding</h3>
          {!showAddForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              Add holding
            </Button>
          )}
        </div>

        {showAddForm && (
          <HoldingForm
            value={newHolding}
            baseCurrency={baseCurrency}
            onChange={setNewHolding}
            onSubmit={handleAdd}
            onCancel={
              initialHoldings.length > 0
                ? () => {
                    setShowAddForm(false);
                    setAddErrors({});
                    setNewHolding(createEmptyHolding(baseCurrency));
                  }
                : undefined
            }
            submitLabel="Add holding"
            isSubmitting={isAdding}
            errors={addErrors}
            idPrefix="new-holding"
          />
        )}
      </div>
    </div>
  );
}
