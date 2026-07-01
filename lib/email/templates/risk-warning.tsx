import { Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

export type RiskEmailVariant =
  | "urgent_risk"
  | "weekly_summary"
  | "concentration"
  | "manual_review";

export type RiskEmailDetail = {
  symbol?: string;
  reason: string;
  riskLevel?: string | null;
};

export type RiskWarningEmailProps = {
  variant: RiskEmailVariant;
  headline: string;
  summary: string;
  details: RiskEmailDetail[];
  appUrl: string;
  ctaPath?: string;
  periodLabel?: string;
};

function variantMeta(variant: RiskEmailVariant, periodLabel?: string) {
  switch (variant) {
    case "urgent_risk":
      return {
        title: `Urgent Risk Warning${periodLabel ? ` — ${periodLabel}` : ""}`,
        preview: "Urgent portfolio risk alert requiring your review.",
        ctaLabel: "Review risk on dashboard",
        ctaPath: "/dashboard",
      };
    case "weekly_summary":
      return {
        title: `Weekly Risk Summary${periodLabel ? ` — ${periodLabel}` : ""}`,
        preview: "Your weekly market risk summary is available.",
        ctaLabel: "View weekly summary",
        ctaPath: "/news-input",
      };
    case "concentration":
      return {
        title: "Portfolio Concentration Warning",
        preview: "Your portfolio concentration limits need attention.",
        ctaLabel: "Review portfolio",
        ctaPath: "/dashboard",
      };
    case "manual_review":
      return {
        title: "Manual Review Required",
        preview: "One or more holdings require manual review before new buys.",
        ctaLabel: "Review holdings",
        ctaPath: "/dashboard",
      };
  }
}

export function RiskWarningEmail({
  variant,
  headline,
  summary,
  details,
  appUrl,
  ctaPath,
  periodLabel,
}: RiskWarningEmailProps) {
  const meta = variantMeta(variant, periodLabel);

  return (
    <EmailLayout
      preview={meta.preview}
      title={meta.title}
      appUrl={appUrl}
      ctaLabel={meta.ctaLabel}
      ctaPath={ctaPath ?? meta.ctaPath}
    >
      <Text style={headlineStyle}>{headline}</Text>
      <Text style={textStyle}>{summary}</Text>

      {details.length > 0 && (
        <Section>
          {details.map((detail, index) => (
            <Text key={`${detail.symbol ?? "detail"}-${index}`} style={listStyle}>
              {detail.symbol ? `${detail.symbol}: ` : ""}
              {detail.reason}
              {detail.riskLevel ? ` (risk: ${detail.riskLevel})` : ""}
            </Text>
          ))}
        </Section>
      )}

      <Text style={actionStyle}>
        Action: Review your portfolio and decide on manual trades. PortfolioPilot
        does not execute trades automatically.
      </Text>
    </EmailLayout>
  );
}

const headlineStyle = {
  color: "#111111",
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const textStyle = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const listStyle = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 6px",
};

const actionStyle = {
  color: "#333333",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "22px",
  margin: "16px 0 0",
};
