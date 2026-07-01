import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { MANUAL_TRADING_DISCLAIMER } from "@/lib/email/constants";

type EmailLayoutProps = {
  preview: string;
  title: string;
  appUrl: string;
  ctaLabel?: string;
  ctaPath?: string;
  children: ReactNode;
};

export function EmailLayout({
  preview,
  title,
  appUrl,
  ctaLabel = "Open PortfolioPilot",
  ctaPath = "/dashboard",
  children,
}: EmailLayoutProps) {
  const ctaUrl = `${appUrl.replace(/\/$/, "")}${ctaPath}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>{title}</Heading>
          <Section>{children}</Section>
          <Hr style={hrStyle} />
          <Text style={ctaStyle}>
            <Link href={ctaUrl} style={linkStyle}>
              {ctaLabel}
            </Link>
          </Text>
          <Text style={disclaimerStyle}>{MANUAL_TRADING_DISCLAIMER}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f6f6f6",
  fontFamily: "Arial, sans-serif",
  margin: "0",
  padding: "24px 0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "24px",
};

const headingStyle = {
  color: "#111111",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const hrStyle = {
  borderColor: "#e5e5e5",
  margin: "24px 0",
};

const ctaStyle = {
  fontSize: "14px",
  margin: "0 0 12px",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
};

const disclaimerStyle = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};
