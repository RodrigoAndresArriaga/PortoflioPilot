export type EmailEnv = {
  apiKey: string;
  from: string;
  appUrl: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailEnv(): EmailEnv {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("RESEND_FROM is not configured.");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return { apiKey, from, appUrl };
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
}
