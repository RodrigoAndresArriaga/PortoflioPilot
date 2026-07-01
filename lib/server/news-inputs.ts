"use server";

import { revalidatePath } from "next/cache";

import {
  buildNewsInputChildRows,
  buildNewsInputHeaderRow,
} from "@/lib/news-input/fan-out";
import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import {
  dispatchManualReviewRequired,
  dispatchUrgentRiskWarning,
  dispatchWeeklyRiskSummary,
  extractManualReviewReasons,
} from "@/lib/server/email-dispatch";
import { getUserPortfolio } from "@/lib/server/portfolio";
import {
  getReportPeriod,
  newsReportTypeSchema,
  parsePastedNewsJson,
  saveNewsInputSchema,
  type DailyUrgentScanReport,
  type NewsReport,
  type NewsReportType,
  type WeeklyMarketReviewReport,
} from "@/lib/validation/news-input";
import type { ManualNewsInput } from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type NewsReportWithChildren = {
  header: ManualNewsInput;
  children: ManualNewsInput[];
};

type GetNewsReportsFilters = {
  reportType?: NewsReportType;
  limit?: number;
};

async function loadReportWithChildren(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  headerId: string,
  userId: string,
): Promise<NewsReportWithChildren | null> {
  const { data: header, error: headerError } = await supabase
    .from("manual_news_inputs")
    .select("*")
    .eq("id", headerId)
    .eq("user_id", userId)
    .eq("is_report_header", true)
    .maybeSingle();

  if (headerError || !header) {
    return null;
  }

  const { data: children, error: childrenError } = await supabase
    .from("manual_news_inputs")
    .select("*")
    .eq("parent_id", headerId)
    .eq("user_id", userId)
    .order("symbol");

  if (childrenError) {
    return null;
  }

  return { header, children: children ?? [] };
}

export async function saveNewsInput(
  raw: unknown,
): Promise<MutationResult<NewsReportWithChildren>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload: NewsReport;
  try {
    if (typeof raw === "string" || (raw && typeof raw === "object" && !("payload" in (raw as object)))) {
      payload = parsePastedNewsJson(raw);
    } else {
      payload = saveNewsInputSchema.parse(raw).payload;
    }
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  const { supabase, user } = auth;
  const reportPeriod = getReportPeriod(payload);
  const headerRow = buildNewsInputHeaderRow(payload, user.id, portfolio.id);

  const { data: existingHeader, error: existingError } = await supabase
    .from("manual_news_inputs")
    .select("id")
    .eq("portfolio_id", portfolio.id)
    .eq("report_type", payload.report_type)
    .eq("report_period", reportPeriod)
    .eq("is_report_header", true)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  let headerId = existingHeader?.id;

  if (headerId) {
    const { error: updateError } = await supabase
      .from("manual_news_inputs")
      .update({
        payload: headerRow.payload,
      })
      .eq("id", headerId)
      .eq("user_id", user.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { error: deleteChildrenError } = await supabase
      .from("manual_news_inputs")
      .delete()
      .eq("parent_id", headerId)
      .eq("user_id", user.id);

    if (deleteChildrenError) {
      return { ok: false, error: deleteChildrenError.message };
    }
  } else {
    const { data: insertedHeader, error: insertError } = await supabase
      .from("manual_news_inputs")
      .insert(headerRow)
      .select("*")
      .single();

    if (insertError || !insertedHeader) {
      return {
        ok: false,
        error: insertError?.message ?? "Failed to save news report.",
      };
    }

    headerId = insertedHeader.id;
  }

  const childRows = buildNewsInputChildRows(payload, {
    userId: user.id,
    portfolioId: portfolio.id,
    headerId,
  });

  if (childRows.length > 0) {
    const { error: childInsertError } = await supabase
      .from("manual_news_inputs")
      .insert(childRows);

    if (childInsertError) {
      return { ok: false, error: childInsertError.message };
    }
  }

  const saved = await loadReportWithChildren(supabase, headerId, user.id);
  if (!saved) {
    return { ok: false, error: "Failed to load saved news report." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/news-input");

  void dispatchNewsInputEmails(user.id, saved).catch((error) => {
    console.error("[email] News input dispatch failed:", error);
  });

  return { ok: true, data: saved };
}

function dispatchNewsInputEmails(
  userId: string,
  saved: NewsReportWithChildren,
): Promise<void> {
  const payload = saved.header.payload;
  if (!payload || typeof payload !== "object") {
    return Promise.resolve();
  }

  const reportType = saved.header.report_type;
  const reportPeriod = saved.header.report_period;
  const tasks: Promise<void>[] = [];

  if (reportType === "daily_urgent_scan" && "urgent_news" in payload) {
    tasks.push(
      dispatchUrgentRiskWarning(userId, payload as DailyUrgentScanReport),
    );
  }

  if (reportType === "weekly_market_review") {
    tasks.push(
      dispatchWeeklyRiskSummary(userId, payload as WeeklyMarketReviewReport),
    );
  }

  const manualReviewReasons = extractManualReviewReasons(
    reportType,
    reportPeriod,
    saved.children,
  );
  if (manualReviewReasons.length > 0) {
    tasks.push(dispatchManualReviewRequired(userId, manualReviewReasons));
  }

  return Promise.all(tasks).then(() => undefined);
}

export async function getNewsReports(
  filters: GetNewsReportsFilters = {},
): Promise<NewsReportWithChildren[] | null> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return [];
  }

  let query = auth.supabase
    .from("manual_news_inputs")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("portfolio_id", portfolio.id)
    .eq("is_report_header", true)
    .order("report_period", { ascending: false });

  if (filters.reportType) {
    query = query.eq("report_type", filters.reportType);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data: headers, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const reports: NewsReportWithChildren[] = [];
  for (const header of headers ?? []) {
    const report = await loadReportWithChildren(
      auth.supabase,
      header.id,
      auth.user.id,
    );
    if (report) {
      reports.push(report);
    }
  }

  return reports;
}

export async function getNewsReport(
  reportType: NewsReportType,
  reportPeriod: string,
): Promise<NewsReportWithChildren | null> {
  try {
    newsReportTypeSchema.parse(reportType);
  } catch {
    return null;
  }

  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return null;
  }

  const { data: header, error } = await auth.supabase
    .from("manual_news_inputs")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("portfolio_id", portfolio.id)
    .eq("report_type", reportType)
    .eq("report_period", reportPeriod)
    .eq("is_report_header", true)
    .maybeSingle();

  if (error || !header) {
    return null;
  }

  return loadReportWithChildren(auth.supabase, header.id, auth.user.id);
}

export async function getLatestNewsReport(
  reportType: NewsReportType,
): Promise<NewsReportWithChildren | null> {
  const reports = await getNewsReports({ reportType, limit: 1 });
  return reports?.[0] ?? null;
}
