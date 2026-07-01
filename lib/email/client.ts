import { Resend } from "resend";

import { getEmailEnv, isEmailConfigured } from "@/lib/email/env";

let resendClient: Resend | null = null;

export { isEmailConfigured };

export function getResendClient(): Resend {
  if (!resendClient) {
    const { apiKey } = getEmailEnv();
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
