"use client";

import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Check,
  ChevronRight,
  CircleAlert,
  Database,
  Download,
  FileCheck2,
  FileUp,
  Fingerprint,
  Gauge,
  GitMerge,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  WalletCards,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { ChangeEvent, useMemo, useRef, useState } from "react";

type SourceType = "order" | "invoice" | "bank" | "settlement";
type View = "workbench" | "policy" | "credential" | "verifier";

type EvidenceRecord = {
  id: string;
  source: SourceType;
  timestamp: string;
  amount: number;
  counterparty: string;
  reference: string;
  trust: "source-verified" | "document-verified" | "self-declared";
};

type RevenueEvent = {
  id: string;
  timestamp: string;
  amount: number;
  counterparty: string;
  sourceIds: string[];
  sources: SourceType[];
  confidence: number;
  status: "verified" | "supported" | "unmatched";
};

type PolicyCheck = {
  label: string;
  detail: string;
  value: string;
  pass: boolean;
  code: string;
};

const SAMPLE_EVIDENCE: EvidenceRecord[] = [
  { id: "ord-101", source: "order", timestamp: "2026-04-03T09:12:00.000Z", amount: 4200, counterparty: "Northstar Studio", reference: "PP-APR-101", trust: "source-verified" },
  { id: "inv-101", source: "invoice", timestamp: "2026-04-03T09:18:00.000Z", amount: 4200, counterparty: "Northstar Studio", reference: "PP-APR-101", trust: "document-verified" },
  { id: "upi-101", source: "bank", timestamp: "2026-04-03T10:02:00.000Z", amount: 4200, counterparty: "Northstar Studio", reference: "PP-APR-101", trust: "source-verified" },
  { id: "ord-102", source: "order", timestamp: "2026-04-11T06:30:00.000Z", amount: 6800, counterparty: "Saanjh Collective", reference: "PP-APR-102", trust: "source-verified" },
  { id: "upi-102", source: "settlement", timestamp: "2026-04-11T07:04:00.000Z", amount: 6800, counterparty: "Saanjh Collective", reference: "PP-APR-102", trust: "source-verified" },
  { id: "inv-103", source: "invoice", timestamp: "2026-04-20T11:00:00.000Z", amount: 12000, counterparty: "Locale Events", reference: "PP-APR-103", trust: "document-verified" },
  { id: "upi-103", source: "bank", timestamp: "2026-04-21T05:30:00.000Z", amount: 12000, counterparty: "Locale Events", reference: "PP-APR-103", trust: "source-verified" },
  { id: "ord-104", source: "order", timestamp: "2026-04-27T08:45:00.000Z", amount: 9100, counterparty: "Northstar Studio", reference: "PP-APR-104", trust: "source-verified" },
  { id: "upi-104", source: "bank", timestamp: "2026-04-27T09:06:00.000Z", amount: 9100, counterparty: "Northstar Studio", reference: "PP-APR-104", trust: "source-verified" },
  { id: "ord-201", source: "order", timestamp: "2026-05-05T08:10:00.000Z", amount: 7600, counterparty: "Northstar Studio", reference: "PP-MAY-201", trust: "source-verified" },
  { id: "inv-201", source: "invoice", timestamp: "2026-05-05T08:16:00.000Z", amount: 7600, counterparty: "Northstar Studio", reference: "PP-MAY-201", trust: "document-verified" },
  { id: "upi-201", source: "settlement", timestamp: "2026-05-05T08:50:00.000Z", amount: 7600, counterparty: "Northstar Studio", reference: "PP-MAY-201", trust: "source-verified" },
  { id: "ord-202", source: "order", timestamp: "2026-05-13T07:20:00.000Z", amount: 14200, counterparty: "Locale Events", reference: "PP-MAY-202", trust: "source-verified" },
  { id: "upi-202", source: "bank", timestamp: "2026-05-13T09:15:00.000Z", amount: 14200, counterparty: "Locale Events", reference: "PP-MAY-202", trust: "source-verified" },
  { id: "inv-203", source: "invoice", timestamp: "2026-05-22T09:00:00.000Z", amount: 8600, counterparty: "Saanjh Collective", reference: "PP-MAY-203", trust: "document-verified" },
  { id: "upi-203", source: "bank", timestamp: "2026-05-22T09:44:00.000Z", amount: 8600, counterparty: "Saanjh Collective", reference: "PP-MAY-203", trust: "source-verified" },
  { id: "ord-204", source: "order", timestamp: "2026-05-29T06:30:00.000Z", amount: 11800, counterparty: "Field Office Co", reference: "PP-MAY-204", trust: "source-verified" },
  { id: "upi-204", source: "bank", timestamp: "2026-05-29T07:01:00.000Z", amount: 11800, counterparty: "Field Office Co", reference: "PP-MAY-204", trust: "source-verified" },
  { id: "ord-301", source: "order", timestamp: "2026-06-04T09:10:00.000Z", amount: 9800, counterparty: "Northstar Studio", reference: "PP-JUN-301", trust: "source-verified" },
  { id: "upi-301", source: "settlement", timestamp: "2026-06-04T09:34:00.000Z", amount: 9800, counterparty: "Northstar Studio", reference: "PP-JUN-301", trust: "source-verified" },
  { id: "inv-302", source: "invoice", timestamp: "2026-06-14T10:00:00.000Z", amount: 15400, counterparty: "Locale Events", reference: "PP-JUN-302", trust: "document-verified" },
  { id: "upi-302", source: "bank", timestamp: "2026-06-14T10:48:00.000Z", amount: 15400, counterparty: "Locale Events", reference: "PP-JUN-302", trust: "source-verified" },
  { id: "ord-303", source: "order", timestamp: "2026-06-21T07:20:00.000Z", amount: 7200, counterparty: "Saanjh Collective", reference: "PP-JUN-303", trust: "source-verified" },
  { id: "upi-303", source: "bank", timestamp: "2026-06-21T08:02:00.000Z", amount: 7200, counterparty: "Saanjh Collective", reference: "PP-JUN-303", trust: "source-verified" },
  { id: "ord-304", source: "order", timestamp: "2026-06-28T06:10:00.000Z", amount: 12600, counterparty: "Field Office Co", reference: "PP-JUN-304", trust: "source-verified" },
  { id: "upi-304", source: "bank", timestamp: "2026-06-28T07:25:00.000Z", amount: 12600, counterparty: "Field Office Co", reference: "PP-JUN-304", trust: "source-verified" },
  { id: "bank-x1", source: "bank", timestamp: "2026-06-29T13:00:00.000Z", amount: 25000, counterparty: "Own Account Transfer", reference: "SELF-TRANSFER", trust: "source-verified" },
  { id: "cash-x1", source: "order", timestamp: "2026-06-30T11:10:00.000Z", amount: 3500, counterparty: "Walk-in Customer", reference: "CASH-NOTE", trust: "self-declared" },
];

const NAV_ITEMS: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "workbench", label: "Evidence graph", icon: Network },
  { id: "policy", label: "Decision lab", icon: SlidersHorizontal },
  { id: "credential", label: "Proof passport", icon: Fingerprint },
  { id: "verifier", label: "Lender view", icon: Landmark },
];

const SOURCE_META: Record<SourceType, { label: string; short: string }> = {
  order: { label: "Commerce order", short: "ORD" },
  invoice: { label: "Invoice", short: "INV" },
  bank: { label: "Bank credit", short: "BNK" },
  settlement: { label: "UPI settlement", short: "UPI" },
};

function normalizedText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isMatch(a: EvidenceRecord, b: EvidenceRecord) {
  const timeGap = Math.abs(new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const amountGap = Math.abs(a.amount - b.amount);
  const amountTolerance = Math.max(2, a.amount * 0.01);
  const sameReference =
    a.reference &&
    b.reference &&
    normalizedText(a.reference) === normalizedText(b.reference);
  const sameParty =
    normalizedText(a.counterparty).includes(normalizedText(b.counterparty)) ||
    normalizedText(b.counterparty).includes(normalizedText(a.counterparty));
  return amountGap <= amountTolerance && timeGap <= 72 * 60 * 60 * 1000 && (sameReference || sameParty);
}

function reconcileEvidence(records: EvidenceRecord[]): RevenueEvent[] {
  const commerce = records.filter((item) => item.source === "order" || item.source === "invoice");
  const payments = records.filter((item) => item.source === "bank" || item.source === "settlement");
  const used = new Set<string>();
  const events: RevenueEvent[] = [];

  commerce.forEach((seed) => {
    if (used.has(seed.id)) return;
    const relatedCommerce = commerce.filter(
      (candidate) => candidate.id !== seed.id && !used.has(candidate.id) && isMatch(seed, candidate),
    );
    const relatedPayments = payments.filter(
      (candidate) => !used.has(candidate.id) && isMatch(seed, candidate),
    );
    const group = [seed, ...relatedCommerce, ...relatedPayments];
    group.forEach((item) => used.add(item.id));
    const sources = [...new Set(group.map((item) => item.source))];
    const hasPayment = sources.includes("bank") || sources.includes("settlement");
    const confidence = Math.min(
      98,
      Math.round(
        35 +
          sources.length * 17 +
          group.filter((item) => item.trust === "source-verified").length * 4,
      ),
    );
    events.push({
      id: `rev-${seed.id}`,
      timestamp: seed.timestamp,
      amount: seed.amount,
      counterparty: seed.counterparty,
      sourceIds: group.map((item) => item.id),
      sources,
      confidence,
      status: hasPayment && sources.length >= 3 ? "verified" : hasPayment ? "supported" : "unmatched",
    });
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthKey(timestamp: string) {
  return timestamp.slice(0, 7);
}

function computeMetrics(events: RevenueEvent[], records: EvidenceRecord[]) {
  const accepted = events.filter((event) => event.status !== "unmatched");
  const verified = events.filter((event) => event.status === "verified");
  const monthly = accepted.reduce<Record<string, number>>((totals, event) => {
    totals[monthKey(event.timestamp)] = (totals[monthKey(event.timestamp)] ?? 0) + event.amount;
    return totals;
  }, {});
  const monthlyValues = Object.values(monthly);
  const total = accepted.reduce((sum, event) => sum + event.amount, 0);
  const averageMonthly = monthlyValues.length ? total / monthlyValues.length : 0;
  const mean = averageMonthly;
  const variance = monthlyValues.length
    ? monthlyValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / monthlyValues.length
    : 0;
  const volatility = mean ? Math.sqrt(variance) / mean : 1;
  const parties = accepted.reduce<Record<string, number>>((totals, event) => {
    totals[event.counterparty] = (totals[event.counterparty] ?? 0) + event.amount;
    return totals;
  }, {});
  const largestParty = Math.max(0, ...Object.values(parties));
  const concentration = total ? largestParty / total : 1;
  const confidence = accepted.length
    ? Math.round(accepted.reduce((sum, event) => sum + event.confidence, 0) / accepted.length)
    : 0;
  const selfTransfers = records.filter(
    (record) =>
      record.source === "bank" &&
      (normalizedText(record.reference).includes("selftransfer") ||
        normalizedText(record.counterparty).includes("ownaccount")),
  ).length;
  const excluded = events.filter((event) => event.status === "unmatched").length + selfTransfers;
  const coverage = events.length ? Math.round((accepted.length / events.length) * 100) : 0;
  const sortedMonths = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
  const trend =
    sortedMonths.length > 1
      ? ((sortedMonths.at(-1)?.[1] ?? 0) - (sortedMonths[0]?.[1] ?? 0)) /
        Math.max(sortedMonths[0]?.[1] ?? 1, 1)
      : 0;

  return {
    total,
    averageMonthly,
    months: monthlyValues.length,
    volatility,
    concentration,
    confidence,
    excluded,
    coverage,
    trend,
    triangulatedCount: accepted.length,
    highAssuranceCount: verified.length,
    supportedCount: accepted.length - verified.length,
    monthly: sortedMonths,
    sources: new Set(records.map((record) => record.source)).size,
  };
}

function getPolicyChecks(metrics: ReturnType<typeof computeMetrics>): PolicyCheck[] {
  return [
    {
      label: "Observed history",
      detail: "At least 3 distinct months of evidence",
      value: `${metrics.months} months`,
      pass: metrics.months >= 3,
      code: "HISTORY_3M",
    },
    {
      label: "Verified monthly revenue",
      detail: "Average supported inflow is above the policy floor",
      value: formatMoney(metrics.averageMonthly),
      pass: metrics.averageMonthly >= 35000,
      code: "REV_35K",
    },
    {
      label: "Evidence triangulation",
      detail: "Most commerce events reconcile across at least two independent sources",
      value: `${metrics.coverage}% cross-source`,
      pass: metrics.coverage >= 65,
      code: "PROVENANCE_65",
    },
    {
      label: "Customer concentration",
      detail: "Largest payer is below 45% of supported revenue",
      value: `${Math.round(metrics.concentration * 100)}% largest payer`,
      pass: metrics.concentration <= 0.45,
      code: "CONCENTRATION_45",
    },
    {
      label: "Revenue stability",
      detail: "Monthly coefficient of variation is below 35%",
      value: `${Math.round(metrics.volatility * 100)}% volatility`,
      pass: metrics.volatility <= 0.35,
      code: "VOLATILITY_35",
    },
  ];
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function merkleRoot(records: EvidenceRecord[]) {
  if (!records.length) return "";
  let layer = await Promise.all(
    records
      .map((record) => JSON.stringify(record))
      .sort()
      .map((record) => sha256(record)),
  );
  while (layer.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < layer.length; index += 2) {
      const left = layer[index];
      const right = layer[index + 1] ?? left;
      next.push(await sha256(`${left}${right}`));
    }
    layer = next;
  }
  return layer[0];
}

function parseRows(rows: Record<string, unknown>[], sourceHint: SourceType): EvidenceRecord[] {
  const parsed = rows.map<EvidenceRecord | null>((row, index) => {
      const source = String(row.source ?? row.type ?? sourceHint).toLowerCase() as SourceType;
      const timestamp = String(row.timestamp ?? row.date ?? row.created_at ?? "");
      const amount = Number(
        String(row.amount ?? row.value ?? row.credit ?? "0")
          .replace(/,/g, "")
          .replace(/[^\d.-]/g, ""),
      );
      const counterparty = String(
        row.counterparty ?? row.customer ?? row.payer ?? row.description ?? "Unknown",
      );
      const reference = String(row.reference ?? row.ref ?? row.invoice_id ?? row.order_id ?? "");
      if (!timestamp || !amount || !["order", "invoice", "bank", "settlement"].includes(source)) {
        return null;
      }
      return {
        id: String(row.id ?? `import-${Date.now()}-${index}`),
        source,
        timestamp: new Date(timestamp).toISOString(),
        amount,
        counterpaïm7¶‰žËkºwµçUÌ•á…Ñ±äÝ¡…Ð„Ù•É¥™¥•È…¸Í•”…¹™½È¡½Ü±½¹œ¸ð½Àø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÍÑ…¹‘…ÉµÁ¥±°ˆøñ	…‘•¡•¬Í¥é”õìÄÙô€¼øMLµ½µÁ…Ñ¥‰±”Í¡•µ„ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•‘•¹Ñ¥…°µ±…å½ÕÐˆø(€€€€€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰Á…¹•°½¹Í•¹ÐµÁ…¹•°ˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¹•°µ¡•…‘•Èˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Á…¹•°µ­¥­•Èˆù¥Í±½ÍÕÉ”Á½±¥äð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñ ÌùY•É¥™¥•ÈÁ•Éµ¥ÍÍ¥½¹Ìð½ Ìø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñM¡¥•±‘¡•¬Í¥é”õìÈÉô€¼ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰½¹Í•¹Ðµ±¥ÍÐˆø(€€€€€€€€€€€€€€€€€€ñ½¹Í•¹ÑQ½±”(€€€€€€€€€€€€€€€€€€€¡•­•õíÍ¡…É•I•Ù•¹Õ•ô(€€€€€€€€€€€€€€€€€€€½¹¡…¹”õíÍ•ÑM¡…É•I•Ù•¹Õ•ô(€€€€€€€€€€€€€€€€€€€±…‰•°ô‰I•Ù•¹Õ”Ñ¡É•Í¡½±ˆ(€€€€€€€€€€€€€€€€€€€‘•Ñ…¥°õíAÉ½Ù”µ½¹Ñ¡±äÍÕÁÁ½ÉÑ•É•Ù•¹Õ”¥Ì…‰½Ù”ƒŠ
äÌÔ°ÀÀÀ¸á…ÐÉ•Ù•¹Õ”É•µ…¥¹Ì¡¥‘‘•¸¹ô(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€ñ½¹Í•¹ÑQ½±”(€€€€€€€€€€€€€€€€€€€¡•­•õíÍ¡…É•MÑ…‰¥±¥Ñåô(€€€€€€€€€€€€€€€€€€€½¹¡…¹”õíÍ•ÑM¡…É•MÑ…‰¥±¥Ñåô(€€€€€€€€€€€€€€€€€€€±…‰•°ô‰I•Ù•¹Õ”ÍÑ…‰¥±¥Ñäˆ(€€€€€€€€€€€€€€€€€€€‘•Ñ…¥°ô‰M¡…É”Ý¡•Ñ¡•ÈÑ¡”É•Ù•¹Õ”Á…ÑÑ•É¸µ••ÑÌÑ¡”±•¹‘•ÈÍÑ…‰¥±¥ÑäÁ½±¥ä¸ˆ(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€ñ½¹Í•¹ÑQ½±”(€€€€€€€€€€€€€€€€€€€¡•­•õíÍ¡…É•M½ÕÉ•Íô(€€€€€€€€€€€€€€€€€€€½¹¡…¹”õíÍ•ÑM¡…É•M½ÕÉ•Íô(€€€€€€€€€€€€€€€€€€€±…‰•°ô‰M½ÕÉ”‘¥Ù•ÉÍ¥Ñäˆ(€€€€€€€€€€€€€€€€€€€‘•Ñ…¥°ô‰M¡…É”Ñ¡”¹Õµ‰•È½˜¥¹‘•Á•¹‘•¹Ð•Ù¥‘•¹”Í½ÕÉ”ÑåÁ•Ì¸ˆ(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰•áÁ¥Éäµ½¹ÑÉ½°ˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œù½¹Í•¹Ð•áÁ¥Éäð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùY•É¥™¥•È…•ÍÌ…ÕÑ½µ…Ñ¥…±±ä•áÁ¥É•Ìð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Í•µ•¹Ñ•ˆø(€€€€€€€€€€€€€€€€€€€ílÄ°€Ü°€ÌÁt¹µ…À ¡‘…åÌ¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õí½¹Í•¹Ñ…åÌ€ôôô‘…åÌ€ü€‰…Ñ¥Ù”ˆ€è€ˆ‰ô(€€€€€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•Ñ½¹Í•¹Ñ…åÌ¡‘…åÌ¥ô(€€€€€€€€€€€€€€€€€€€€€€€­•äõí‘…åÍô(€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€í‘…åÍõ(€€€€€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÁÉ¥µ…Éä™Õ±°ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí•¹•É…Ñ•É•‘•¹Ñ¥…±ô‘¥Í…‰±•õíÁÉ½½™	ÕÍäñð€…É•½É‘Ì¹±•¹Ñ¡ôø(€€€€€€€€€€€€€€€€€íÁÉ½½™	ÕÍä€ü€ñI•™É•Í¡Ü±…ÍÍ9…µ”ô‰ÍÁ¥¸ˆÍ¥é”õìÄÝô€¼ø€è€ñ¥¹•ÉÁÉ¥¹ÐÍ¥é”õìÄÝô€¼ùô(€€€€€€€€€€€€€€€€€•¹•É…Ñ”ÁÉ¥Ù…Ñ”½µµ¥Ñµ•¹Ð(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰Á…ÍÍÁ½ÉÐˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…ÍÍÁ½ÉÐµÑ½Àˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùAeAI==€¼=55IAMMA=IPð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùÍ¡„!½µ”½½‘Ìð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€€€ñÍµ…±°ù…Í”A@´ÈÀÐàƒ
ÜU‘å…´¥‘•¹Ñ¥Ñäµ…Ñ¡•ð½Íµ…±°ø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Á…ÍÍÁ½ÉÐµµ…É¬ˆøñ¥¹•ÉÁÉ¥¹ÐÍ¥é”õìÈÑô€¼øð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±…¥´µ‰…¹ˆø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùA½±¥äÉ•ÍÕ±Ðð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùí‘•¥Í¥½¹ôð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰±…¥´µÉ¥ˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùI•Ù•¹Õ”Ñ¡É•Í¡½±ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùíÍ¡…É•I•Ù•¹Õ”€ü€¡µ•ÑÉ¥Ì¹…Ù•É…•5½¹Ñ¡±ä€øô€ÌÔÀÀÀ€ü€‰‰½Ù”ƒŠ
äÌÕ¬ˆ€è€‰9½Ðµ•Ðˆ¤€è€‰9½ÐÍ¡…É•‰ôð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùMÑ…‰¥±¥ÑäÁÉ•‘¥…Ñ”ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùíÍ¡…É•MÑ…‰¥±¥Ñä€ü€¡µ•ÑÉ¥Ì¹Ù½±…Ñ¥±¥Ñä€ðô€À¸ÌÔ€ü€‰A½±¥äµ•Ðˆ€è€‰I•Ù¥•Üˆ¤€è€‰9½ÐÍ¡…É•‰ôð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ù=‰Í•ÉÙ•¡¥ÍÑ½Éäð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùíµ•ÑÉ¥Ì¹µ½¹Ñ¡Íôµ½¹Ñ¡Ìð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùáÁ¥É•Ìð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùí½¹Í•¹Ñ…åÍô‘…åÌð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰½µµ¥Ñµ•¹Ðµ‰±½¬ˆø(€€€€€€€€€€€€€€€€€€ñ‘¥ØøñÍÁ…¸ùÙ¥‘•¹”É½½Ðð½ÍÁ…¸øñ½‘”ùíÍ¡½ÉÑ!…Í ¡É½½Ð¥ôð½½‘”øð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥ØøñÍÁ…¸ùÉ•‘•¹Ñ¥…°½µµ¥Ñµ•¹Ðð½ÍÁ…¸øñ½‘”ùíÍ¡½ÉÑ!…Í ¡½µµ¥Ñµ•¹Ð¥ôð½½‘”øð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…ÍÍÁ½ÉÐµ™½½Ñ•Èˆø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸øñ1½­-•å¡½±”Í¥é”õìÄÑô€¼øI…Ü•Ù¥‘•¹”•á±Õ‘•ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸øñ…Ñ…‰…Í”Í¥é”õìÄÑô€¼øM¡•µ„ØÈð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸øñUÍ•ÉI½Õ¹‘¡•¬Í¥é”õìÄÑô€¼ø!Õµ…¸É•Ù¥•Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰Á…¹•°¡…¥¸µÁ…¹•°ˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¹•°µ¡•…‘•Èˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Á…¹•°µ­¥­•ÈˆùQÉÕÍÐÉ…¥°ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñ ÌùM½±…¹„ÁÉ½½˜½µµ¥Ñµ•¹Ðð½ Ìø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õíÑÉ…¹Í…Ñ¥½¸€ü€‰¡…¥¸µ±¥Ù”½¹™¥Éµ•ˆ€è€‰¡…¥¸µ±¥Ù”‰ôøñ¤€¼øíÑÉ…¹Í…Ñ¥½¸€ü€‰½¹™¥Éµ•ˆ€è€‰•Ù¹•Ð‰ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¡…¥¸µÍÑ•ÁÌˆø(€€€€€€€€€€€€€€€€€€ñ¡…¥¹MÑ•À‘½¹”õí	½½±•…¸¡½µµ¥Ñµ•¹Ð¥ô¥½¸õí¥±•¡•¬Éô±…‰•°ô‰É•‘•¹Ñ¥…°½µµ¥Ñµ•¹ÐˆÙ…±Õ”õí½µµ¥Ñµ•¹Ð€üÍ¡½ÉÑ!…Í ¡½µµ¥Ñµ•¹Ð¤€è€‰•¹•É…Ñ”™¥ÉÍÐ‰ô€¼ø(€€€€€€€€€€€€€€€€€€ñ¡…¥¹MÑ•À‘½¹”õí	½½±•…¸¡Ý…±±•Ñ‘‘É•ÍÌ¥ô¥½¸õí]…±±•Ñ…É‘Íô±…‰•°ô‰%ÍÍÕ•ÈÝ…±±•ÐˆÙ…±Õ”õíÝ…±±•Ñ‘‘É•ÍÌ€üÍ¡½ÉÑ!…Í ¡Ý…±±•Ñ‘‘É•ÍÌ¤€è€‰9½Ð½¹¹•Ñ•‰ô€¼ø(€€€€€€€€€€€€€€€€€€ñ¡…¥¹MÑ•À‘½¹”õí	½½±•…¸¡ÑÉ…¹Í…Ñ¥½¸¥ô¥½¸õí	…‘•¡•­ô±…‰•°ô‰=¸µ¡…¥¸É••¥ÁÐˆÙ…±Õ”õíÑÉ…¹Í…Ñ¥½¸€üÍ¡½ÉÑ!…Í ¡ÑÉ…¹Í…Ñ¥½¸¤€è€‰9½Ð…¹¡½É•‰ô€¼ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰ÁÉ½½˜µµ•ÍÍ…”ˆùíÁÉ½½™5•ÍÍ…•ôð½Àø(€€€€€€€€€€€€€€€ì…Ý…±±•Ñ‘‘É•ÍÌ€ü€ (€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸½ÕÑ±¥¹”™Õ±°ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí½¹¹•Ñ]…±±•Ñôø(€€€€€€€€€€€€€€€€€€€€ñ]…±±•Ñ…É‘ÌÍ¥é”õìÄÝô€¼ø½¹¹•ÐM½±…¹„Ý…±±•Ð(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÁÉ¥µ…Éä™Õ±°ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí…¹¡½É½µµ¥Ñµ•¹Ñô‘¥Í…‰±•õíÁÉ½½™	ÕÍåôø(€€€€€€€€€€€€€€€€€€€íÁÉ½½™	ÕÍä€ü€ñI•™É•Í¡Ü±…ÍÍ9…µ”ô‰ÍÁ¥¸ˆÍ¥é”õìÄÝô€¼ø€è€ñ-•åI½Õ¹Í¥é”õìÄÝô€¼ùô(€€€€€€€€€€€€€€€€€€€¹¡½ÈÁÉ½½˜½¸‘•Ù¹•Ð(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€íÑÉ…¹Í…Ñ¥½¸€˜˜€ (€€€€€€€€€€€€€€€€€€ñ„±…ÍÍ9…µ”ô‰•áÁ±½É•Èµ±¥¹¬ˆ¡É•˜õí¡ÑÑÁÌè¼½•áÁ±½É•È¹Í½±…¹„¹½´½Ñà¼‘íÑÉ…¹Í…Ñ¥½¹ôý±ÕÍÑ•Èõ‘•Ù¹•ÑôÑ…É•Ðô‰}‰±…¹¬ˆÉ•°ô‰¹½É•™•ÉÉ•Èˆø(€€€€€€€€€€€€€€€€€€€=Á•¸M½±…¹„É••¥ÁÐ€ñÉÉ½ÝUÁI¥¡ÐÍ¥é”õìÄÕô€¼ø(€€€€€€€€€€€€€€€€€€ð½„ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€¥ô((€€€€€€€íÙ¥•Ü€ôôô€‰Ù•É¥™¥•Èˆ€˜˜€ (€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰Á…”µ½¹Ñ•¹ÐÙ•É¥™¥•ÈµÁ…”ˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™¥•ÈµÑ½½±‰…Èˆø(€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰•å•‰É½ÜˆùáÑ•É¹…°Ù•É¥™¥•ÈÁÉ•Ù¥•Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñ Èù1•¹‘•ÈÍ••ÌÑ¡”‘•¥Í¥½¸•Ù¥‘•¹”°¹½ÐÑ¡”‘½Õµ•¹ÑÌ¸ð½ Èø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…•ÍÌµÁ¥±°ˆøñ1½­-•å¡½±”Í¥é”õìÄÕô€¼ø•ÍÌ•áÁ¥É•Ì¥¸í½¹Í•¹Ñ…åÍô‘…åÌð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰Ù•É¥™¥…Ñ¥½¸µÍ¡••Ðˆø(€€€€€€€€€€€€€€ñ¡•…‘•Èø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™äµ‰É…¹ˆø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‰É…¹µÍåµ‰½°ˆù@ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñ‘¥ØøñÍÑÉ½¹œùA…åAÉ½½˜Y•É¥™äð½ÍÑÉ½¹œøñÍµ…±°ùÉåÁÑ½É…Á¡¥Œ½µµ•É”•Ù¥‘•¹”ð½Íµ…±°øð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õí½µµ¥Ñµ•¹Ð€ü€‰Ù•É¥™¥•µÁ¥±°É•…‘äˆ€è€‰Ù•É¥™¥•µÁ¥±°‰ôø(€€€€€€€€€€€€€€€€€í½µµ¥Ñµ•¹Ð€ü€ñ	…‘•¡•¬Í¥é”õìÄÙô€¼ø€è€ñ¥É±•±•ÉÐÍ¥é”õìÄÙô€¼ùô(€€€€€€€€€€€€€€€€€í½µµ¥Ñµ•¹Ð€ü€‰É•‘•¹Ñ¥…°Ù…±¥ˆ€è€‰É•‘•¹Ñ¥…°Á•¹‘¥¹œ‰ô(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½¡•…‘•Èø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™äµ¡•É¼ˆø(€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Á…¹•°µ­¥­•Èˆù5•É¡…¹Ð±…¥´ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñ Ìùí‘•¥Í¥½¹ôð½ Ìø(€€€€€€€€€€€€€€€€€€ñÀù½ÈÝ½É­¥¹œµ…Á¥Ñ…°µ…¹Õ…°É•Ù¥•Ü¸Q¡¥Ì¥Ì¹½Ð„±½…¸…ÁÁÉ½Ù…°½È‰ÕÉ•…ÔÍ½É”¸ð½Àø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™äµÍ½É”ˆø(€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùíÁ…ÍÍ½Õ¹Ñô½íÁ½±¥ä¹±•¹Ñ¡ôð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùÁ½±¥ä¡•­Ìµ•Ðð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™äµ±…¥µÌˆø(€€€€€€€€€€€€€€€íÍ¡…É•I•Ù•¹Õ”€˜˜€ñY•É¥™¥•É±…¥´¥½¸õí	…¹­¹½Ñ•ô±…‰•°ô‰I•Ù•¹Õ”Ñ¡É•Í¡½±ˆÙ…±Õ”õíµ•ÑÉ¥Ì¹…Ù•É…•5½¹Ñ¡±ä€øô€ÌÔÀÀÀ€ü€‰‰½Ù”ƒŠ
äÌÔ°ÀÀÀ€¼µ½¹Ñ ˆ€è€‰Q¡É•Í¡½±¹½Ðµ•Ð‰ô€¼ùô(€€€€€€€€€€€€€€€íÍ¡…É•MÑ…‰¥±¥Ñä€˜˜€ñY•É¥™¥•É±…¥´¥½¸õíÑ¥Ù¥Ñåô±…‰•°ô‰I•Ù•¹Õ”ÍÑ…‰¥±¥ÑäˆÙ…±Õ”õíµ•ÑÉ¥Ì¹Ù½±…Ñ¥±¥Ñä€ðô€À¸ÌÔ€ü€‰A½±¥ä½¹‘¥Ñ¥½¸µ•Ðˆ€è€‰5…¹Õ…°É•Ù¥•ÜÉ•ÅÕ¥É•‰ô€¼ùô(€€€€€€€€€€€€€€€íÍ¡…É•M½ÕÉ•Ì€˜˜€ñY•É¥™¥•É±…¥´¥½¸õí¥Ñ5•É•ô±…‰•°ô‰%¹‘•Á•¹‘•¹ÐÍ½ÕÉ•ÌˆÙ…±Õ”õí€‘íµ•ÑÉ¥Ì¹Í½ÕÉ•Íô•Ù¥‘•¹”ÑåÁ•Íô€¼ùô(€€€€€€€€€€€€€€€€ñY•É¥™¥•É±…¥´¥½¸õíM¡¥•±‘¡•­ô±…‰•°ô‰Ù¥‘•¹”½¹™¥‘•¹”ˆÙ…±Õ”õí€‘íµ•ÑÉ¥Ì¹½¹™¥‘•¹•ô•ô€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™äµ…Õ‘¥Ðˆø(€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùÙ¥‘•¹”½µµ¥Ñµ•¹Ðð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñ½‘”ùí½µµ¥Ñµ•¹Ðñð€‰É•‘•¹Ñ¥…°¡…Ì¹½Ð‰••¸•¹•É…Ñ•‰ôð½½‘”ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùM½±…¹„É••¥ÁÐð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñ½‘”ùíÑÉ…¹Í…Ñ¥½¸ñð€‰Ý…¥Ñ¥¹œ½¸µ¡…¥¸…¹¡½È‰ôð½½‘”ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùI…Ü‘½Õµ•¹ÑÌð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÑÉ½¹œùU¹…Ù…¥±…‰±”‰ä‘•Í¥¸ð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ™½½Ñ•Èø(€€€€€€€€€€€€€€€€ñÍÁ…¸øñM¡¥•±‘¡•¬Í¥é”õìÄÕô€¼ø%ÍÍÕ•ÈÍ¥¹…ÑÕÉ”¡•­•ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸øñ¥±•¡•¬ÈÍ¥é”õìÄÕô€¼øA½±¥äÉ••¥ÁÐÉ•Á±…å…‰±”ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸øñ1½­-•å¡½±”Í¥é”õìÄÕô€¼øAÕÉÁ½Í”µ‰½Õ¹…•ÍÌð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½™½½Ñ•Èø(€€€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€¥ô(€€€€€€ð½µ…¥¸ø((€€€€€í¥µÁ½ÉÑ=Á•¸€˜˜€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ½‘…°µ‰…­‘É½ÀˆÉ½±”ô‰ÁÉ•Í•¹Ñ…Ñ¥½¸ˆ½¹5½ÕÍ•½Ý¸õì ¤€ôøÍ•Ñ%µÁ½ÉÑ=Á•¸¡™…±Í”¥ôø(€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰¥µÁ½ÉÐµµ½‘…°ˆÉ½±”ô‰‘¥…±½œˆ…É¥„µµ½‘…°ô‰ÑÉÕ”ˆ…É¥„µ±…‰•±±•‘‰äô‰¥µÁ½ÉÐµÑ¥Ñ±”ˆ½¹5½ÕÍ•½Ý¸õì¡•Ù•¹Ð¤€ôø•Ù•¹Ð¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¥ôø(€€€€€€€€€€€€ñ¡•…‘•Èø(€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰•å•‰É½ÜˆùAÉ¥Ù…Ñ”•Ù¥‘•¹”¥µÁ½ÉÐð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñ È¥ô‰¥µÁ½ÉÐµÑ¥Ñ±”ˆù‘½µµ•É”É•½É‘Ìð½ Èø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰¥½¸µ‰ÕÑÑ½¸ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ%µÁ½ÉÑ=Á•¸¡™…±Í”¥ôÑ¥Ñ±”ô‰±½Í”¥µÁ½ÉÐˆø(€€€€€€€€€€€€€€€€ñ`Í¥é”õìÄáô€¼ø(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ð½¡•…‘•Èø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÁÉ¥Ù…äµ¹½Ñ¥”ˆø(€€€€€€€€€€€€€€ñ1½­-•å¡½±”Í¥é”õìÈÁô€¼ø(€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€ñÍÑÉ½¹œù1½…°ÁÉ½•ÍÍ¥¹œ¥Ì…Ñ¥Ù”ð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€€€ñÀùe½ÕÈMX½È)M=8¥ÌÁ…ÉÍ•¥¸Ñ¡¥Ì‰É½ÝÍ•È¸Q¡”É…Ü™¥±”¥Ì¹½ÐÍ•¹ÐÑ¼A…åAÉ½½˜¸ð½Àø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ñ±…‰•°±…ÍÍ9…µ”ô‰™¥•±µ±…‰•°ˆ¡Ñµ±½Èô‰Í½ÕÉ”µ¡¥¹Ðˆù•™…Õ±ÐÍ½ÕÉ”ÑåÁ”ð½±…‰•°ø(€€€€€€€€€€€€ñÍ•±•Ð¥ô‰Í½ÕÉ”µ¡¥¹ÐˆÙ…±Õ”õíÍ½ÕÉ•!¥¹Ñô½¹¡…¹”õì¡•Ù•¹Ð¤€ôøÍ•ÑM½ÕÉ•!¥¹Ð¡•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”…ÌM½ÕÉ•QåÁ”¥ôø(€€€€€€€€€€€€€ì¡=‰©•Ð¹­•åÌ¡M=UI}5Q¤…ÌM½ÕÉ•QåÁ•mt¤¹µ…À ¡Í½ÕÉ”¤€ôø€ (€€€€€€€€€€€€€€€€ñ½ÁÑ¥½¸Ù…±Õ”õíÍ½ÕÉ•ô­•äõíÍ½ÕÉ•ôùíM=UI}5QmÍ½ÕÉ•t¹±…‰•±ôð½½ÁÑ¥½¸ø(€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€ð½Í•±•Ðø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‘É½Àµé½¹”ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø¥¹ÁÕÑI•˜¹ÕÉÉ•¹Ðü¹±¥¬ ¥ôø(€€€€€€€€€€€€€€ñUÁ±½…‘±½ÕÍ¥é”õìÈáô€¼ø(€€€€€€€€€€€€€€ñÍÑÉ½¹œù¡½½Í”MX½È)M=8•Ù¥‘•¹”ð½ÍÑÉ½¹œø(€€€€€€€€€€€€€€ñÍÁ…¸ùI•ÅÕ¥É•è‘…Ñ”°…µ½Õ¹Ð…¹½Õ¹Ñ•ÉÁ…ÉÑä¸=ÁÑ¥½¹…°èÉ•™•É•¹”°Í½ÕÉ”…¹¥¸ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ¥¹ÁÕÐÉ•˜õí¥¹ÁÕÑI•™ô±…ÍÍ9…µ”ô‰¡¥‘‘•¸µ¥¹ÁÕÐˆÑåÁ”ô‰™¥±”ˆµÕ±Ñ¥Á±”…•ÁÐôˆ¹ÍØ°¹©Í½¸±Ñ•áÐ½ÍØ±…ÁÁ±¥…Ñ¥½¸½©Í½¸ˆ½¹¡…¹”õí¥µÁ½ÉÑ¥±•Íô€¼ø(€€€€€€€€€€€í¥µÁ½ÉÑ5•ÍÍ…”€˜˜€ñÀ±…ÍÍ9…µ”ô‰¥µÁ½ÉÐµµ•ÍÍ…”ˆùí¥µÁ½ÉÑ5•ÍÍ…•ôð½Àùô(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ½‘…°µ™½½Ñ•Èˆø(€€€€€€€€€€€€€€ñ„±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÍÕ‰Ñ±”ˆ¡É•˜ôˆ½Í…µÁ±•Ì½Á…åÁÉ½½˜µÁ¥±½Ðµ•Ù¥‘•¹”¹é¥Àˆ‘½Ý¹±½…ø(€€€€€€€€€€€€€€€€ñ½Ý¹±½…Í¥é”õìÄÝô€¼ø½Ý¹±½…Í…µÁ±”‰Õ¹‘±”(€€€€€€€€€€€€€€ð½„ø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÍÕ‰Ñ±”ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí±½…‘M…µÁ±•ôøñMÁ…É­±•ÌÍ¥é”õìÄÝô€¼øUÍ”Á¥±½Ð‘…Ñ…Í•Ðð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÁÉ¥µ…ÉäˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ%µÁ½ÉÑ=Á•¸¡™…±Í”¥ôù½¹”ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€¥ô(€€€€ð½‘¥Øø(€€¤ì)ô()ÑåÁ”]…±±•ÑAÉ½Ù¥‘•È€ôì(€¥ÍM½±™±…É”üè‰½½±•…¸ì(€ÁÕ‰±¥-•äüèìÑ½MÑÉ¥¹œ ¤èÍÑÉ¥¹œôì(€½¹¹•Ð ¤èAÉ½µ¥Í”ñìÁÕ‰±¥-•äüèìÑ½MÑÉ¥¹œ ¤èÍÑÉ¥¹œôôøì(€Í¥¹¹‘M•¹‘QÉ…¹Í…Ñ¥½¸üè€¡ÑÉ…¹Í…Ñ¥½¸èÕ¹­¹½Ý¸¤€ôøAÉ½µ¥Í”ñÍÑÉ¥¹œðìÍ¥¹…ÑÕÉ”èÍÑÉ¥¹œôøì(€Í¥¹QÉ…¹Í…Ñ¥½¸üè€¡ÑÉ…¹Í…Ñ¥½¸èÕ¹­¹½Ý¸¤€ôøAÉ½µ¥Í”ñìÍ•É¥…±¥é” ¤èU¥¹ÐáÉÉ…äôøì)ôì()™Õ¹Ñ¥½¸5•ÑÉ¥Œ¡ì(€¥½¸è%½¸°(€±…‰•°°(€Ù…±Õ”°(€¹½Ñ”°)ôèì(€¥½¸èÑåÁ•½˜	…¹­¹½Ñ”ì(€±…‰•°èÍÑÉ¥¹œì(€Ù…±Õ”èÍÑÉ¥¹œì(€¹½Ñ”èÍÑÉ¥¹œì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ…ÉÑ¥±”±…ÍÍ9…µ”ô‰µ•ÑÉ¥Œˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ•ÑÉ¥Œµ¡•…ˆøñÍÁ…¸ùí±…‰•±ôð½ÍÁ…¸øñ%½¸Í¥é”õìÄáô€¼øð½‘¥Øø(€€€€€€ñÍÑÉ½¹œùíÙ…±Õ•ôð½ÍÑÉ½¹œø(€€€€€€ñÍµ…±°ùí¹½Ñ•ôð½Íµ…±°ø(€€€€ð½…ÉÑ¥±”ø(€€¤ì)ô()™Õ¹Ñ¥½¸MÑ…ÑÕÌ¡ìÍÑ…ÑÕÌôèìÍÑ…ÑÕÌèI•Ù•¹Õ•Ù•¹Ñl‰ÍÑ…ÑÕÌ‰tô¤ì(€É•ÑÕÉ¸€ (€€€€ñÍÁ…¸±…ÍÍ9…µ”õíÍÑ…ÑÕÌ€‘íÍÑ…ÑÕÍõôø(€€€€€€ñ¤€¼ø(€€€€€íÍÑ…ÑÕÌ€ôôô€‰Ù•É¥™¥•ˆ€ü€‰Y•É¥™¥•ˆ€èÍÑ…ÑÕÌ€ôôô€‰ÍÕÁÁ½ÉÑ•ˆ€ü€‰MÕÁÁ½ÉÑ•ˆ€è€‰U¹µ…Ñ¡•‰ô(€€€€ð½ÍÁ…¸ø(€€¤ì)ô()™Õ¹Ñ¥½¸µÁÑåMÑ…Ñ”¡ì½¹1½…°½¹%µÁ½ÉÐôèì½¹1½… ¤èÙ½¥ì½¹%µÁ½ÉÐ ¤èÙ½¥ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰•µÁÑäµÍÑ…Ñ”ˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰•µÁÑäµ¥½¸ˆøñ9•ÑÝ½É¬Í¥é”õìÈáô€¼øð½‘¥Øø(€€€€€€ñ Ìù9¼½µµ•É”É…Á å•Ðð½ Ìø(€€€€€€ñÀù%µÁ½ÉÐÉ•…°É•½É‘Ì½È±½…Ñ¡”Á¥±½Ð…Í”Ñ¼Í•”•Ù¥‘•¹”É•½¹¥±¥…Ñ¥½¸Ý½É­¥¹œ¸ð½Àø(€€€€€€ñ‘¥Øø(€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÁÉ¥µ…ÉäˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí½¹1½…‘ôøñMÁ…É­±•ÌÍ¥é”õìÄÝô€¼ø1½…Á¥±½Ð…Í”ð½‰ÕÑÑ½¸ø(€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰‰ÕÑÑ½¸ÍÕ‰Ñ±”ˆÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí½¹%µÁ½ÉÑôøñ¥±•UÀÍ¥é”õìÄÝô€¼ø%µÁ½ÉÐ‘…Ñ„ð½‰ÕÑÑ½¸ø(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸½¹Í•¹ÑQ½±”¡ì(€¡•­•°(€½¹¡…¹”°(€±…‰•°°(€‘•Ñ…¥°°)ôèì(€¡•­•è‰½½±•…¸ì(€½¹¡…¹”¡Ù…±Õ”è‰½½±•…¸¤èÙ½¥ì(€±…‰•°èÍÑÉ¥¹œì(€‘•Ñ…¥°èÍÑÉ¥¹œì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ±…‰•°±…ÍÍ9…µ”ô‰½¹Í•¹ÐµÉ½Üˆø(€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õí¡•­•€ü€‰Ñ½±”½¸ˆ€è€‰Ñ½±”‰ôøñ¤€¼øð½ÍÁ…¸ø(€€€€€€ñÍÁ…¸øñÍÑÉ½¹œùí±…‰•±ôð½ÍÑÉ½¹œøñÍµ…±°ùí‘•Ñ…¥±ôð½Íµ…±°øð½ÍÁ…¸ø(€€€€€€ñ¥¹ÁÕÐÑåÁ”ô‰¡•­‰½àˆ¡•­•õí¡•­•‘ô½¹¡…¹”õì¡•Ù•¹Ð¤€ôø½¹¡…¹”¡•Ù•¹Ð¹Ñ…É•Ð¹¡•­•¥ô€¼ø(€€€€ð½±…‰•°ø(€€¤ì)ô()™Õ¹Ñ¥½¸¡…¥¹MÑ•À¡ì(€‘½¹”°(€¥½¸è%½¸°(€±…‰•°°(€Ù…±Õ”°)ôèì(€‘½¹”è‰½½±•…¸ì(€¥½¸èÑåÁ•½˜¥±•¡•¬Èì(€±…‰•°èÍÑÉ¥¹œì(€Ù…±Õ”èÍÑÉ¥¹œì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¡…¥¸µÍÑ•Àˆø(€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õí‘½¹”€ü€‰‘½¹”ˆ€è€ˆ‰ôùí‘½¹”€ü€ñ¡•¬Í¥é”õìÄÙô€¼ø€è€ñ%½¸Í¥é”õìÄÙô€¼ùôð½ÍÁ…¸ø(€€€€€€ñ‘¥ØøñÍÑÉ½¹œùí±…‰•±ôð½ÍÑÉ½¹œøñ½‘”ùíÙ…±Õ•ôð½½‘”øð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸Y•É¥™¥•É±…¥´¡ì(€¥½¸è%½¸°(€±…‰•°°(€Ù…±Õ”°)ôèì(€¥½¸èÑåÁ•½˜	…¹­¹½Ñ”ì(€±…‰•°èÍÑÉ¥¹œì(€Ù…±Õ”èÍÑÉ¥¹œì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ù•É¥™¥•Èµ±…¥´ˆø(€€€€€€ñÍÁ…¸øñ%½¸Í¥é”õìÄáô€¼øð½ÍÁ…¸ø(€€€€€€ñ‘¥ØøñÍµ…±°ùí±…‰•±ôð½Íµ…±°øñÍÑÉ½¹œùíÙ…±Õ•ôð½ÍÑÉ½¹œøð½‘¥Øø(€€€€€€ñ	…‘•¡•¬Í¥é”õìÄáô€¼ø(€€€€ð½‘¥Øø(€€¤ì)ô(