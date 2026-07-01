export const QUOTE_TTL_MS = 15 * 60 * 1000;

export function isQuoteStale(quotedAt: string | null | undefined): boolean {
  if (!quotedAt) {
    return true;
  }
  return Date.now() - new Date(quotedAt).getTime() >= QUOTE_TTL_MS;
}
