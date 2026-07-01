import { Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

export type MonthlyPlanEmailItem = {
  symbol: string;
  amount: number;
  reason?: string | null;
};

export type MonthlyPlanEmailProps = {
  month: string;
  monthLabel: string;
  monthlyAmount: number;
  currency: string;
  items: MonthlyPlanEmailItem[];
  cashReserve: number;
  appUrl: string;
  variant: "plan_ready" | "reminder";
};

function formatAmount(amount: number, currency: string): string {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function MonthlyPlanEmail({
  month,
  monthLabel,
  monthlyAmount,
  currency,
  items,
  cashReserve,
  appUrl,
  variant,
}: MonthlyPlanEmailProps) {
  const isReminder = variant === "reminder";
  const title = isReminder
    ? `Monthly Investment Reminder — ${monthLabel}`
    : `Monthly Investment Plan Ready — ${monthLabel}`;
  const preview = isReminder
    ? `Reminder to review your ${monthLabel} investment plan.`
    : `Your ${monthLabel} manual buy plan is ready to review.`;
  const intro = isReminder
    ? `Today is your scheduled investment day for ${monthLabel}. Review your plan and place trades manually when ready.`
    : `Your monthly buy plan for ${monthLabel} is ready. Review the recommended manual buys below.`;

  const buyItems = items.filter((item) => item.amount > 0);
  const riskNotes = buyItems
    .filter((item) => item.reason?.trim())
    .map((item) => `${item.symbol}: ${item.reason}`);

  return (
    <EmailLayout
      preview={preview}
      title={title}
      appUrl={appUrl}
      ctaLabel={isReminder ? "Review monthly plan" : "View monthly plan"}
      ctaPath="/monthly-plan"
    >
      <Text style={textStyle}>{intro}</Text>
      <Text style={labelStyle}>Monthly budget</Text>
      <Text style={valueStyle}>{formatAmount(monthlyAmount, currency)}</Text>

      {buyItems.length > 0 && (
        <>
          <Text style={labelStyle}>Recommended manual buys</Text>
          {buyItems.map((item) => (
            <Text key={`${month}-${item.symbol}`} style={listStyle}>
              {item.symbol}: {formatAmount(item.amount, currency)}
            </Text>
          ))}
        </>
      )}

      {cashReserve > 0 && (
        <Text style={listStyle}>
          Cash reserve: {formatAmount(cashReserve, currency)}
        </Text>
      )}

      {riskNotes.length > 0 && (
        <>
          <Text style={labelStyle}>Risk notes</Text>
          {riskNotes.map((note) => (
            <Text key={note} style={listStyle}>
              {note}
            </Text>
          ))}
        </>
      )}

      <Text style={actionStyle}>
        Action: Review and manually place trades in your brokerage account.
      </Text>
    </EmailLayout>
  );
}

const textStyle = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const labelStyle = {
  color: "#111111",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const valueStyle = {
  color: "#333333",
  fontSize: "14px",
  margin: "0 0 16px",
};

const listStyle = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 4px",
};

const actionStyle = {
  color: "#333333",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "22px",
  margin: "16px 0 0",
};
