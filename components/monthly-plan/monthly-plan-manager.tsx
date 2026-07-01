"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BuyRecommendationCard } from "@/components/monthly-plan/buy-recommendation-card";
import { CashReserveCard } from "@/components/monthly-plan/cash-reserve-card";
import { ManualTradeChecklist } from "@/components/monthly-plan/manual-trade-checklist";
import { MonthlyPlanReadinessAlert } from "@/components/monthly-plan/monthly-plan-readiness-alert";
import { MonthlyPlanActions } from "@/components/monthly-plan/monthly-plan-actions";
import { MonthlyPlanSummaryCard } from "@/components/monthly-plan/monthly-plan-summary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCashSymbol } from "@/lib/monthly-plan/format";
import {
  generateMonthlyPlan,
  markMonthlyPlanCompleted,
  saveMonthlyPlan,
} from "@/lib/server/monthly-plans";
import {
  saveMonthlyPlanSchema,
  type MonthlyPlanItemInput,
} from "@/lib/validation/monthly-plan";
import type { MonthlyPlanReadiness } from "@/lib/portfolio-lifecycle";
import type { MonthlyPlanWithItems } from "@/types/database";

type MonthlyPlanManagerProps = {
  initialPlan: MonthlyPlanWithItems | null;
  month: string;
  readiness?: MonthlyPlanReadiness | null;
  showTransitionHint?: boolean;
};

function toEditableItems(plan: MonthlyPlanWithItems): MonthlyPlanItemInput[] {
  return plan.items.map((item) => ({
    symbol: item.symbol,
    recommendation_score: item.recommendation_score,
    technical_score: item.technical_score,
    news_modifier_score: item.news_modifier_score,
    risk_score: item.risk_score,
    concentration_flag: item.concentration_flag,
    manual_review_required: item.manual_review_required,
    decision_basis: item.decision_basis,
    recommended_amount: item.recommended_amount,
    adjusted_amount: item.adjusted_amount,
    reason: item.reason,
  }));
}

function itemsMatch(
  left: MonthlyPlanItemInput[],
  right: MonthlyPlanItemInput[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightBySymbol = new Map(
    right.map((item) => [item.symbol.trim().toUpperCase(), item.adjusted_amount]),
  );

  return left.every((item) => {
    const symbol = item.symbol.trim().toUpperCase();
    return rightBySymbol.get(symbol) === item.adjusted_amount;
  });
}

export function MonthlyPlanManager({
  initialPlan,
  month,
  readiness = null,
  showTransitionHint = false,
}: MonthlyPlanManagerProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [items, setItems] = useState<MonthlyPlanItemInput[]>(() =>
    initialPlan ? toEditableItems(initialPlan) : [],
  );
  const [savedItems, setSavedItems] = useState<MonthlyPlanItemInput[]>(() =>
    initialPlan ? toEditableItems(initialPlan) : [],
  );
  const [checkedSymbols, setCheckedSymbols] = useState<Set<string>>(
    () => new Set(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    setPlan(initialPlan);
    const nextItems = initialPlan ? toEditableItems(initialPlan) : [];
    setItems(nextItems);
    setSavedItems(nextItems);
    setCheckedSymbols(new Set());
  }, [initialPlan]);

  const isCompleted = plan?.plan.status === "completed";
  const readOnly = isCompleted;
  const isDirty = !itemsMatch(items, savedItems);

  const assetItems = useMemo(
    () => items.filter((item) => !isCashSymbol(item.symbol)),
    [items],
  );
  const cashItem = useMemo(
    () => items.find((item) => isCashSymbol(item.symbol)),
    [items],
  );

  const tradeSymbols = useMemo(
    () =>
      items
        .filter((item) => item.adjusted_amount > 0)
        .map((item) => item.symbol.trim().toUpperCase()),
    [items],
  );

  const allTradesChecked =
    tradeSymbols.length === 0 ||
    tradeSymbols.every((symbol) => checkedSymbols.has(symbol));

  function refresh() {
    router.refresh();
  }

  function handleAmountChange(symbol: string, amount: number) {
    setItems((current) =>
      current.map((item) =>
        item.symbol.trim().toUpperCase() === symbol
          ? { ...item, adjusted_amount: Number.isFinite(amount) ? amount : 0 }
          : item,
      ),
    );
  }

  function handleToggleTrade(symbol: string, checked: boolean) {
    setCheckedSymbols((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(symbol);
      } else {
        next.delete(symbol);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (plan && isDirty) {
      const confirmed = window.confirm(
        "Regenerating will replace your unsaved changes. Continue?",
      );
      if (!confirmed) {
        return;
      }
    } else if (plan) {
      const confirmed = window.confirm(
        "Regenerating will replace the current plan with fresh recommendations. Continue?",
      );
      if (!confirmed) {
        return;
      }
    }

    setFormError(null);
    setIsGenerating(true);
    const result = await generateMonthlyPlan(month);
    setIsGenerating(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setPlan(result.data);
    const nextItems = toEditableItems(result.data);
    setItems(nextItems);
    setSavedItems(nextItems);
    setCheckedSymbols(new Set());
    refresh();
  }

  async function handleSave() {
    if (!plan) {
      return;
    }

    setFormError(null);

    const payload = {
      month: plan.plan.month,
      monthly_amount: plan.plan.monthly_amount,
      currency: plan.plan.currency,
      status: plan.plan.status,
      items,
    };

    const parsed = saveMonthlyPlanSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid plan data.");
      return;
    }

    setIsSaving(true);
    const result = await saveMonthlyPlan(parsed.data);
    setIsSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setPlan(result.data);
    const nextItems = toEditableItems(result.data);
    setItems(nextItems);
    setSavedItems(nextItems);
    refresh();
  }

  async function handleMarkComplete() {
    if (!plan) {
      return;
    }

    setFormError(null);
    setIsCompleting(true);
    const result = await markMonthlyPlanCompleted(plan.plan.id);
    setIsCompleting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setPlan({ plan: result.data, items: plan.items });
    refresh();
  }

  return (
    <div className="space-y-8">
      {readiness ? <MonthlyPlanReadinessAlert readiness={readiness} /> : null}

      {showTransitionHint && !initialPlan ? (
        <Alert>
          <AlertDescription>
            This is your first regular monthly plan after the initial
            recommendation flow. Review amounts and tap Generate plan when you
            are ready — nothing is created automatically.
          </AlertDescription>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <MonthlyPlanActions
        hasPlan={Boolean(plan)}
        isCompleted={isCompleted}
        isGenerating={isGenerating}
        isSaving={isSaving}
        isCompleting={isCompleting}
        canMarkComplete={Boolean(plan) && allTradesChecked && !isDirty}
        canGenerate={readiness?.canGenerate ?? true}
        onGenerate={handleGenerate}
        onSave={handleSave}
        onMarkComplete={handleMarkComplete}
      />

      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle>No plan for this month yet</CardTitle>
            <CardDescription>
              Generate a plan to see exact recommended buy amounts for your
              portfolio. You place each trade manually in your brokerage.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <MonthlyPlanSummaryCard plan={plan.plan} items={items} />

          {cashItem ? (
            <CashReserveCard
              item={cashItem}
              currency={plan.plan.currency}
              readOnly={readOnly}
              onAmountChange={handleAmountChange}
            />
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Recommended buys</h3>
              <p className="text-sm text-muted-foreground">
                Exact amounts to buy manually this month. No trades are placed
                automatically.
              </p>
            </div>
            <div className="space-y-3">
              {assetItems.map((item) => (
                <BuyRecommendationCard
                  key={item.symbol}
                  item={item}
                  currency={plan.plan.currency}
                  readOnly={readOnly}
                  onAmountChange={handleAmountChange}
                />
              ))}
            </div>
          </div>

          <ManualTradeChecklist
            items={items}
            currency={plan.plan.currency}
            checkedSymbols={checkedSymbols}
            readOnly={readOnly}
            onToggle={handleToggleTrade}
          />

          {isCompleted ? (
            <Alert>
              <AlertDescription>
                This plan is marked complete. Generate a new plan next month when
                you are ready.
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      )}
    </div>
  );
}
