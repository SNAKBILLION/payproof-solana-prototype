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
import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { clearVaultState, loadVaultState, saveVaultState } from "./browser-vault";
import { ProofVerifier } from "./proof-verifier";
import {
  DEVNET_RPC,
  MEMO_PROGRAM_ID,
  type CredentialPayload,
  type ProofPackage,
  credentialCommitment,
  decodeProofPackage,
  proofMemo,
  sha256,
} from "./proof-protocol";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

type VaultState = {
  records: EvidenceRecord[];
  consentDays: number;
  shareRevenue: boolean;
  shareStability: boolean;
  shareSources: boolean;
  credentialPayload: CredentialPayload | null;
  commitment: string;
  root: string;
  walletAddress: string;
  transaction: string;
  proofPackage: ProofPackage | null;
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
        counterparty,
        reference,
        trust: source === "order" || source === "settlement" ? "source-verified" : "document-verified",
      } satisfies EvidenceRecord;
    });

  return parsed.filter((record): record is EvidenceRecord => record !== null);
}

function shortHash(value: string) {
  return value ? `${value.slice(0, 9)}...${value.slice(-7)}` : "Not generated";
}

export function PayProofApp() {
  const [view, setView] = useState<View>("workbench");
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [sourceHint, setSourceHint] = useState<SourceType>("bank");
  const [importMessage, setImportMessage] = useState("");
  const [consentDays, setConsentDays] = useState(7);
  const [shareRevenue, setShareRevenue] = useState(true);
  const [shareStability, setShareStability] = useState(true);
  const [shareSources, setShareSources] = useState(false);
  const [credentialPayload, setCredentialPayload] = useState<CredentialPayload | null>(null);
  const [commitment, setCommitment] = useState("");
  const [root, setRoot] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [transaction, setTransaction] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const [proofMessage, setProofMessage] = useState("Generate a private credential commitment.");
  const [walletNotice, setWalletNotice] = useState("");
  const [proofPackage, setProofPackage] = useState<ProofPackage | null>(null);
  const [externalProof, setExternalProof] = useState<ProofPackage | null>(null);
  const [vaultReady, setVaultReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const events = useMemo(() => reconcileEvidence(records), [records]);
  const metrics = useMemo(() => computeMetrics(events, records), [events, records]);
  const policy = useMemo(() => getPolicyChecks(metrics), [metrics]);
  const passCount = policy.filter((item) => item.pass).length;
  const decision =
    records.length === 0
      ? "Awaiting evidence"
      : passCount === policy.length
        ? "Second-look ready"
        : passCount >= 3
          ? "Manual review"
          : "Evidence incomplete";
  const filteredEvents = events.filter(
    (event) =>
      normalizedText(event.counterparty).includes(normalizedText(query)) ||
      normalizedText(event.sources.join(" ")).includes(normalizedText(query)),
  );
  const anchored = Boolean(
    proofPackage &&
      transaction &&
      proofPackage.transaction === transaction &&
      proofPackage.commitment === commitment,
  );

  useEffect(() => {
    let active = true;
    async function restore() {
      const encoded = window.location.hash.startsWith("#proof=")
        ? window.location.hash.slice("#proof=".length)
        : "";
      if (encoded) {
        try {
          if (active) setExternalProof(decodeProofPackage(encoded));
        } catch (error) {
          if (active) setWalletNotice((error as Error).message);
        } finally {
          if (active) setVaultReady(true);
        }
        return;
      }

      try {
        const saved = await loadVaultState<VaultState>();
        if (!active || !saved) return;
        setRecords(saved.records ?? []);
        setConsentDays(saved.consentDays ?? 7);
        setShareRevenue(saved.shareRevenue ?? true);
        setShareStability(saved.shareStability ?? true);
        setShareSources(saved.shareSources ?? false);
        setCredentialPayload(saved.credentialPayload ?? null);
        setCommitment(saved.commitment ?? "");
        setRoot(saved.root ?? "");
        setWalletAddress(saved.walletAddress ?? "");
        setTransaction(saved.transaction ?? "");
        setProofPackage(saved.proofPackage ?? null);
        if (saved.proofPackage) setProofMessage("Anchored proof restored from the encrypted browser vault.");
        else if (saved.records?.length) setProofMessage("Private case restored from the encrypted browser vault.");
      } catch {
        if (active) setWalletNotice("The encrypted browser vault could not be restored. Starting a clean case.");
      } finally {
        if (active) setVaultReady(true);
      }
    }
    void restore();
    function openProofFromHash() {
      if (!window.location.hash.startsWith("#proof=")) return;
      try {
        setExternalProof(
          decodeProofPackage(window.location.hash.slice("#proof=".length)),
        );
      } catch (error) {
        setWalletNotice((error as Error).message);
      }
    }
    window.addEventListener("hashchange", openProofFromHash);
    return () => {
      active = false;
      window.removeEventListener("hashchange", openProofFromHash);
    };
  }, []);

  useEffect(() => {
    if (!vaultReady || externalProof) return;
    const timer = window.setTimeout(() => {
      void saveVaultState({
        records,
        consentDays,
        shareRevenue,
        shareStability,
        shareSources,
        credentialPayload,
        commitment,
        root,
        walletAddress,
        transaction,
        proofPackage,
      } satisfies VaultState).catch(() => {
        setWalletNotice("Browser vault update failed. Keep this tab open until the proof is anchored.");
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    commitment,
    consentDays,
    credentialPayload,
    externalProof,
    proofPackage,
    records,
    root,
    shareRevenue,
    shareSources,
    shareStability,
    transaction,
    vaultReady,
    walletAddress,
  ]);

  function invalidateProof(message = "Proof settings changed. Generate a new commitment before anchoring.") {
    setCredentialPayload(null);
    setCommitment("");
    setRoot("");
    setTransaction("");
    setProofPackage(null);
    setProofMessage(message);
  }

  function loadSample() {
    setRecords(SAMPLE_EVIDENCE);
    invalidateProof("Evidence loaded locally. Review the graph before issuing proof.");
  }

  function clearCase() {
    setRecords([]);
    setCommitment("");
    setRoot("");
    setWalletAddress("");
    setCredentialPayload(null);
    setProofPackage(null);
    setTransaction("");
    setProofMessage("Generate a private credential commitment.");
    void clearVaultState();
  }

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    setImportMessage("Reading evidence inside this browser...");
    const imported: EvidenceRecord[] = [];
    for (const file of files) {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        imported.push(...parseRows(Array.isArray(json) ? json : json.records ?? [], sourceHint));
      } else {
        const result = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
        });
        imported.push(...parseRows(result.data, sourceHint));
      }
    }
    if (imported.length) {
      setRecords((current) => [...current, ...imported]);
      invalidateProof("Evidence changed. Review the graph and generate a fresh commitment.");
    }
    setImportMessage(
      imported.length
        ? `${imported.length} records normalized. Raw files were not uploaded.`
        : "No valid rows found. Add date, amount and counterparty columns.",
    );
    event.target.value = "";
  }

  async function generateCredential() {
    if (!records.length) {
      setProofMessage("Add evidence before generating a credential.");
      return;
    }
    setProofBusy(true);
    setProofMessage("Building evidence Merkle tree and policy receipt...");
    try {
      const evidenceRoot = await merkleRoot(records);
      const issuedAt = new Date();
      const payload: CredentialPayload = {
        schema: "payproof.invisible-commerce.v3",
        credentialId: `pp_${crypto.randomUUID()}`,
        subject: {
          id: "merchant:asha-home-foods",
          name: "Asha Home Foods",
        },
        purpose: "working-capital-second-look",
        evidenceRoot,
        policy: {
          id: "working-capital-second-look.v1",
          decision,
          checksPassed: passCount,
          checksTotal: policy.length,
        },
        claims: {
          revenueThreshold: shareRevenue ? metrics.averageMonthly >= 35000 : undefined,
          stableRevenue: shareStability ? metrics.volatility <= 0.35 : undefined,
          sourceDiversity: shareSources ? metrics.sources : undefined,
          observedMonths: metrics.months,
          evidenceConfidence: metrics.confidence,
        },
        issuedAt: issuedAt.toISOString(),
        expiresAt: new Date(issuedAt.getTime() + consentDays * 86400000).toISOString(),
      };
      const reportCommitment = await credentialCommitment(payload);
      setCredentialPayload(payload);
      setRoot(evidenceRoot);
      setCommitment(reportCommitment);
      setTransaction("");
      setProofPackage(null);
      setProofMessage("Private commitment ready. Raw evidence is not included.");
    } catch (error) {
      setProofMessage(`Credential generation failed: ${(error as Error).message}`);
    } finally {
      setProofBusy(false);
    }
  }

  function getProvider() {
    const browser = window as typeof window & {
      solana?: WalletProvider;
      solflare?: WalletProvider;
      Solflare?: WalletProvider;
    };
    const providers = [browser.solflare, browser.Solflare, browser.solana].filter(Boolean);
    return providers.find((provider) => provider?.isSolflare) ?? providers[0] ?? null;
  }

  async function connectWallet() {
    const provider = getProvider();
    if (!provider) {
      const message = "No Solana wallet detected. Unlock Solflare or Phantom, then refresh this page.";
      setProofMessage(message);
      setWalletNotice(message);
      return null;
    }
    try {
      const response = await provider.connect();
      const publicKey = response.publicKey ?? provider.publicKey;
      const address = publicKey?.toString() ?? "";
      setWalletAddress(address);
      const message = "Solana wallet connected. Open Proof passport when you are ready to anchor.";
      setProofMessage(message);
      setWalletNotice(message);
      return provider;
    } catch (error) {
      const message = `Wallet connection cancelled: ${(error as Error).message}`;
      setProofMessage(message);
      setWalletNotice(message);
      return null;
    }
  }

  async function anchorCommitment() {
    if (!commitment || !credentialPayload) {
      await generateCredential();
      setProofMessage("Commitment generated. Review it, then anchor the proof.");
      return;
    }
    if (proofPackage?.commitment === commitment && proofPackage.transaction) {
      setProofMessage("This exact commitment is already anchored. Open Lender view to verify or share it.");
      return;
    }
    const provider = getProvider() ?? (await connectWallet());
    if (!provider?.publicKey) return;
    setProofBusy(true);
    setProofMessage("Preparing Solana devnet proof transaction...");
    try {
      const connection = new Connection(DEVNET_RPC, "finalized");
      const memoProgram = new PublicKey(MEMO_PROGRAM_ID);
      const walletPublicKey = new PublicKey(provider.publicKey.toString());
      const issuer = walletPublicKey.toBase58();
      const memo = proofMemo({ payload: credentialPayload, commitment });
      const transactionRequest = new Transaction().add(
        new TransactionInstruction({
          keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
          programId: memoProgram,
          data: Buffer.from(memo, "utf8"),
        }),
      );
      transactionRequest.feePayer = walletPublicKey;
      const latestBlockhash = await connection.getLatestBlockhash("finalized");
      transactionRequest.recentBlockhash = latestBlockhash.blockhash;
      let signature = "";
      if (typeof provider.signAndSendTransaction === "function") {
        const result = await provider.signAndSendTransaction(transactionRequest);
        signature = typeof result === "string" ? result : result.signature;
      } else if (typeof provider.signTransaction === "function") {
        const signed = await provider.signTransaction(transactionRequest);
        signature = await connection.sendRawTransaction(signed.serialize());
      } else {
        throw new Error("Connected wallet cannot sign Solana transactions.");
      }
      if (!signature) throw new Error("Wallet did not return a transaction signature.");
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "finalized",
      );
      const anchoredProof: ProofPackage = {
        protocol: "PayProof",
        version: 3,
        network: "devnet",
        payload: credentialPayload,
        commitment,
        issuer,
        transaction: signature,
      };
      setTransaction(signature);
      setProofPackage(anchoredProof);
      setProofMessage("Proof finalized on Solana. Open Lender view to independently verify and share it.");
    } catch (error) {
      setProofMessage(`Proof transaction failed: ${(error as Error).message}`);
    } finally {
      setProofBusy(false);
    }
  }

  if (externalProof) {
    return (
      <ProofVerifier
        proof={externalProof}
        external
        onBack={() =>
          window.location.assign(`${window.location.origin}${window.location.pathname}`)
        }
      />
    );
  }

  return (
    <div className="product-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-symbol">P</span>
          <span>
            <strong>PayProof</strong>
            <small>Invisible commerce network</small>
          </span>
        </div>

        <nav className="main-nav" aria-label="PayProof workspace">
          <p>Workspace</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className={view === item.id ? "nav-item active" : "nav-item"}
                onClick={() => setView(item.id)}
                key={item.id}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === "policy" && records.length > 0 && (
                  <b className={passCount === policy.length ? "nav-count pass" : "nav-count"}>
                    {passCount}/{policy.length}
                  </b>
                )}
              </button>
            );
          })}
        </nav>

        <div className="privacy-box">
          <LockKeyhole size={18} />
          <div>
            <strong>Private browser vault</strong>
            <span>Raw evidence stays on this device during analysis.</span>
          </div>
        </div>

        <button
          className="sidebar-footer"
          type="button"
          onClick={() => setMerchantOpen(true)}
          aria-label="Open sample merchant profile"
        >
          <div className="merchant-avatar">AH</div>
          <div>
            <strong>Asha Home Foods</strong>
            <span>Sample merchant · PP-2048</span>
          </div>
          <ChevronRight size={16} />
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="crumb">Cases / PP-2048</span>
            <h1>Working capital evidence review</h1>
          </div>
          <div className="top-actions">
            <span className="network-pill"><i /> Solana devnet</span>
            <button
              className={walletAddress ? "button wallet-button connected" : "button wallet-button"}
              type="button"
              onClick={() => walletAddress ? setView("credential") : void connectWallet()}
              title={walletAddress ? "Open wallet proof controls" : "Connect Solflare or Phantom"}
            >
              <WalletCards size={17} />
              {walletAddress ? shortHash(walletAddress) : "Connect wallet"}
            </button>
            <button className="icon-button" type="button" title="Reset case" onClick={clearCase}>
              <RefreshCw size={17} />
            </button>
            <button className="button outline" type="button" onClick={() => setImportOpen(true)}>
              <FileUp size={17} /> Import evidence
            </button>
          </div>
        </header>

        {view === "workbench" && (
          <section className="page-content">
            <div className="case-banner">
              <div>
                <span className="eyebrow">Live evidence compiler</span>
                <h2>Turn fragmented transactions into verified commerce.</h2>
                <p>
                  Reconcile orders, invoices and payment credits into lender-readable revenue events.
                  Every result keeps its source trail and reason.
                </p>
              </div>
              <div className="banner-actions">
                {!records.length ? (
                  <button className="button primary" type="button" onClick={loadSample}>
                    <Sparkles size={17} /> Load pilot case
                  </button>
                ) : (
                  <button className="button primary" type="button" onClick={() => setView("policy")}>
                    Run decision policy <ArrowUpRight size={17} />
                  </button>
                )}
                <button className="button subtle" type="button" onClick={() => setImportOpen(true)}>
                  <UploadCloud size={17} /> Use my data
                </button>
              </div>
            </div>

            <div className="metric-grid">
              <Metric
                icon={Banknote}
                label="Supported monthly revenue"
                value={records.length ? formatMoney(metrics.averageMonthly) : "—"}
                note={records.length ? `${metrics.months} observed months` : "Waiting for evidence"}
              />
              <Metric
                icon={GitMerge}
                label="Triangulated events"
                value={records.length ? `${metrics.triangulatedCount}` : "—"}
                note={records.length ? `${metrics.coverage}% evidence coverage` : "No graph built"}
              />
              <Metric
                icon={Gauge}
                label="Revenue stability"
                value={records.length ? `${Math.max(0, 100 - Math.round(metrics.volatility * 100))}%` : "—"}
                note={records.length ? `${Math.round(metrics.trend * 100)}% period trend` : "No model output"}
              />
              <Metric
                icon={ShieldCheck}
                label="Proof confidence"
                value={records.length ? `${metrics.confidence}%` : "—"}
                note={records.length ? `${metrics.excluded} excluded signals` : "Not assessed"}
              />
            </div>

            <div className="workbench-grid">
              <section className="panel source-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Evidence inputs</span>
                    <h3>Source coverage</h3>
                  </div>
                  <span className="panel-count">{records.length} records</span>
                </div>
                <div className="source-list">
                  {(Object.keys(SOURCE_META) as SourceType[]).map((source) => {
                    const count = records.filter((record) => record.source === source).length;
                    return (
                      <div className="source-row" key={source}>
                        <span className={`source-icon ${source}`}>{SOURCE_META[source].short}</span>
                        <div>
                          <strong>{SOURCE_META[source].label}</strong>
                          <small>{count ? `${count} records normalized` : "Not connected"}</small>
                        </div>
                        <span className={count ? "source-state connected" : "source-state"}>
                          {count ? <Check size={14} /> : <Link2 size={14} />}
                          {count ? "Ready" : "Add"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button className="button dashed" type="button" onClick={() => setImportOpen(true)}>
                  <FileUp size={17} /> Add source evidence
                </button>
              </section>

              <section className="panel graph-panel">
                <div className="panel-header graph-header">
                  <div>
                    <span className="panel-kicker">Revenue event graph</span>
                    <h3>Reconciled commerce</h3>
                  </div>
                  <label className="search-field">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search payer"
                      aria-label="Search reconciled revenue"
                    />
                  </label>
                </div>
                {!records.length ? (
                  <EmptyState onLoad={loadSample} onImport={() => setImportOpen(true)} />
                ) : (
                  <div className="event-table-wrap">
                    <table className="event-table">
                      <thead>
                        <tr>
                          <th>Revenue event</th>
                          <th>Evidence chain</th>
                          <th>Amount</th>
                          <th>Confidence</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((event) => (
                          <tr key={event.id}>
                            <td>
                              <strong>{event.counterparty}</strong>
                              <span>{new Date(event.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </td>
                            <td>
                              <div className="chain">
                                {event.sources.map((source, index) => (
                                  <span key={source}>
                                    <i className={source}>{SOURCE_META[source].short}</i>
                                    {index < event.sources.length - 1 && <b />}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="money-cell">{formatMoney(event.amount)}</td>
                            <td>
                              <div className="confidence-cell">
                                <span><i style={{ width: `${event.confidence}%` }} /></span>
                                <b>{event.confidence}%</b>
                              </div>
                            </td>
                            <td><Status status={event.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </section>
        )}

        {view === "policy" && (
          <section className="page-content">
            <div className="section-title">
              <div>
                <span className="eyebrow">Explainable decision lab</span>
                <h2>One decision. Every reason replayable.</h2>
                <p>The policy uses normalized evidence, never a black-box universal credit score.</p>
              </div>
              <div className={`decision-badge ${decision.toLowerCase().replaceAll(" ", "-")}`}>
                <span>Current outcome</span>
                <strong>{decision}</strong>
              </div>
            </div>

            <div className="decision-layout">
              <section className="panel policy-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Policy execution</span>
                    <h3>Working capital second-look v1</h3>
                  </div>
                  <span className="policy-version">POLICY 0x31A9</span>
                </div>
                <div className="policy-list">
                  {policy.map((check) => (
                    <div className="policy-row" key={check.code}>
                      <span className={check.pass ? "check-icon pass" : "check-icon fail"}>
                        {check.pass ? <Check size={17} /> : <CircleAlert size={17} />}
                      </span>
                      <div className="policy-copy">
                        <strong>{check.label}</strong>
                        <span>{check.detail}</span>
                        <code>{check.code}</code>
                      </div>
                      <div className="policy-value">
                        <strong>{check.value}</strong>
                        <span>{check.pass ? "Requirement met" : "Needs evidence"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="decision-side">
                <section className="panel outcome-panel">
                  <span className="panel-kicker">Decision receipt</span>
                  <div className="outcome-score">
                    <strong>{passCount}/{policy.length}</strong>
                    <span>policy conditions met</span>
                  </div>
                  <dl>
                    <div><dt>Data quality</dt><dd>{metrics.confidence || 0}%</dd></div>
                    <div><dt>Policy result</dt><dd>{decision}</dd></div>
                    <div><dt>Human review</dt><dd>Required</dd></div>
                  </dl>
                  <button className="button primary full" type="button" onClick={() => setView("credential")} disabled={!records.length}>
                    Create proof passport <ArrowUpRight size={17} />
                  </button>
                </section>

                <section className="gap-panel">
                  <div className="gap-icon"><Activity size={18} /></div>
                  <div>
                    <strong>Evidence gap map</strong>
                    {policy.every((item) => item.pass) ? (
                      <p>No blocking gap. This case is ready for lender second-look review.</p>
                    ) : (
                      <p>{policy.filter((item) => !item.pass).map((item) => item.label).join(" and ")} need improvement or supporting evidence.</p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        )}

        {view === "credential" && (
          <section className="page-content">
            <div className="section-title">
              <div>
                <span className="eyebrow">Consent-bound proof passport</span>
                <h2>Share a claim, not a financial life.</h2>
                <p>The merchant chooses exactly what a verifier can see and for how long.</p>
              </div>
              <span className="standard-pill"><BadgeCheck size={16} /> PayProof schema v3</span>
            </div>

            <div className="credential-layout">
              <section className="panel consent-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Disclosure policy</span>
                    <h3>Verifier permissions</h3>
                  </div>
                  <ShieldCheck size={22} />
                </div>
                <div className="consent-list">
                  <ConsentToggle
                    checked={shareRevenue}
                    onChange={(checked) => {
                      setShareRevenue(checked);
                      invalidateProof();
                    }}
                    label="Revenue threshold"
                    detail={`Prove monthly supported revenue is above ₹35,000. Exact revenue remains hidden.`}
                  />
                  <ConsentToggle
                    checked={shareStability}
                    onChange={(checked) => {
                      setShareStability(checked);
                      invalidateProof();
                    }}
                    label="Revenue stability"
                    detail="Share whether the revenue pattern meets the lender stability policy."
                  />
                  <ConsentToggle
                    checked={shareSources}
                    onChange={(checked) => {
                      setShareSources(checked);
                      invalidateProof();
                    }}
                    label="Source diversity"
                    detail="Share the number of independent evidence source types."
                  />
                </div>
                <div className="expiry-control">
                  <div>
                    <strong>Consent expiry</strong>
                    <span>Verifier access automatically expires</span>
                  </div>
                  <div className="segmented">
                    {[1, 7, 30].map((days) => (
                      <button
                        type="button"
                        className={consentDays === days ? "active" : ""}
                        onClick={() => {
                          setConsentDays(days);
                          invalidateProof();
                        }}
                        key={days}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                <button className="button primary full" type="button" onClick={generateCredential} disabled={proofBusy || !records.length}>
                  {proofBusy ? <RefreshCw className="spin" size={17} /> : <Fingerprint size={17} />}
                  {commitment ? "Regenerate private commitment" : "Generate private commitment"}
                </button>
              </section>

              <section className="passport">
                <div className="passport-top">
                  <div>
                    <span>PAYPROOF / COMMERCE PASSPORT</span>
                    <strong>Asha Home Foods</strong>
                    <small>Case PP-2048 · sample identity bound to issuer wallet</small>
                  </div>
                  <span className="passport-mark"><Fingerprint size={24} /></span>
                </div>
                <div className="claim-band">
                  <span>Policy result</span>
                  <strong>{decision}</strong>
                </div>
                <div className="claim-grid">
                  <div>
                    <span>Revenue threshold</span>
                    <strong>{shareRevenue ? (metrics.averageMonthly >= 35000 ? "Above ₹35k" : "Not met") : "Not shared"}</strong>
                  </div>
                  <div>
                    <span>Stability predicate</span>
                    <strong>{shareStability ? (metrics.volatility <= 0.35 ? "Policy met" : "Review") : "Not shared"}</strong>
                  </div>
                  <div>
                    <span>Observed history</span>
                    <strong>{metrics.months} months</strong>
                  </div>
                  <div>
                    <span>Expires</span>
                    <strong>{consentDays} days</strong>
                  </div>
                </div>
                <div className="commitment-block">
                  <div><span>Evidence root</span><code>{shortHash(root)}</code></div>
                  <div><span>Credential commitment</span><code>{shortHash(commitment)}</code></div>
                </div>
                <div className="passport-footer">
                  <span><LockKeyhole size={14} /> Raw evidence excluded</span>
                  <span><Database size={14} /> Schema v3</span>
                  <span><UserRoundCheck size={14} /> Human review</span>
                </div>
              </section>

              <section className="panel chain-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Trust rail</span>
                    <h3>Solana proof commitment</h3>
                  </div>
                  <span className={anchored ? "chain-live confirmed" : "chain-live"}><i /> {anchored ? "Anchored" : "Devnet"}</span>
                </div>
                <div className="chain-steps">
                  <ChainStep done={Boolean(commitment)} icon={FileCheck2} label="Credential commitment" value={commitment ? shortHash(commitment) : "Generate first"} />
                  <ChainStep done={Boolean(walletAddress)} icon={WalletCards} label="Issuer wallet" value={walletAddress ? shortHash(walletAddress) : "Not connected"} />
                  <ChainStep done={anchored} icon={BadgeCheck} label="On-chain receipt" value={anchored && transaction ? shortHash(transaction) : "Not anchored"} />
                </div>
                <p className="proof-message">{proofMessage}</p>
                {!walletAddress ? (
                  <button className="button outline full" type="button" onClick={connectWallet}>
                    <WalletCards size={17} /> Connect Solana wallet
                  </button>
                ) : (
                  <button className="button primary full" type="button" onClick={anchorCommitment} disabled={proofBusy || anchored}>
                    {proofBusy ? <RefreshCw className="spin" size={17} /> : anchored ? <BadgeCheck size={17} /> : <KeyRound size={17} />}
                    {anchored ? "Proof anchored on devnet" : "Anchor proof on devnet"}
                  </button>
                )}
                {anchored && transaction && (
                  <a className="explorer-link" href={`https://explorer.solana.com/tx/${transaction}?cluster=devnet`} target="_blank" rel="noreferrer">
                    Open Solana receipt <ArrowUpRight size={15} />
                  </a>
                )}
              </section>
            </div>
          </section>
        )}

        {view === "verifier" && <ProofVerifier proof={anchored ? proofPackage : null} />}
      </main>

      {importOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setImportOpen(false)}>
          <section className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span className="eyebrow">Private evidence import</span>
                <h2 id="import-title">Add commerce records</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setImportOpen(false)} title="Close import">
                <X size={18} />
              </button>
            </header>
            <div className="privacy-notice">
              <LockKeyhole size={20} />
              <div>
                <strong>Local processing is active</strong>
                <p>Your CSV or JSON is parsed in this browser. The raw file is not sent to PayProof.</p>
              </div>
            </div>
            <label className="field-label" htmlFor="source-hint">Default source type</label>
            <select id="source-hint" value={sourceHint} onChange={(event) => setSourceHint(event.target.value as SourceType)}>
              {(Object.keys(SOURCE_META) as SourceType[]).map((source) => (
                <option value={source} key={source}>{SOURCE_META[source].label}</option>
              ))}
            </select>
            <button className="drop-zone" type="button" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={28} />
              <strong>Choose CSV or JSON evidence</strong>
              <span>Required: date, amount and counterparty. Optional: reference, source and id.</span>
            </button>
            <input ref={inputRef} className="hidden-input" type="file" multiple accept=".csv,.json,text/csv,application/json" onChange={importFiles} />
            {importMessage && <p className="import-message">{importMessage}</p>}
            <div className="modal-footer">
              <a
                className="button subtle"
                href={`${publicBasePath}/samples/payproof-pilot-evidence.zip`}
                download
              >
                <Download size={17} /> Download sample bundle
              </a>
              <button className="button subtle" type="button" onClick={loadSample}><Sparkles size={17} /> Use pilot dataset</button>
              <button className="button primary" type="button" onClick={() => setImportOpen(false)}>Done</button>
            </div>
          </section>
        </div>
      )}

      {merchantOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMerchantOpen(false)}>
          <section
            className="import-modal merchant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">Current case identity</span>
                <h2 id="merchant-title">Asha Home Foods</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setMerchantOpen(false)} title="Close merchant profile">
                <X size={18} />
              </button>
            </header>
            <div className="merchant-profile-head">
              <div className="merchant-avatar large">AH</div>
              <div>
                <span className="sample-badge">Sample merchant</span>
                <p>
                  Fictional home-food business used to demonstrate PayProof safely.
                  No real merchant identity or Udyam verification is being claimed.
                </p>
              </div>
            </div>
            <dl className="merchant-context-grid">
              <div><dt>Case ID</dt><dd>PP-2048</dd></div>
              <div><dt>Use case</dt><dd>Working capital review</dd></div>
              <div><dt>Evidence</dt><dd>{records.length ? `${records.length} local records` : "Not loaded"}</dd></div>
              <div><dt>Network</dt><dd>Solana devnet</dd></div>
            </dl>
            <div className="merchant-wallet-row">
              <div>
                <span>Issuer wallet</span>
                <strong>{walletAddress ? shortHash(walletAddress) : "Not connected"}</strong>
              </div>
              <button
                className="button outline"
                type="button"
                onClick={() => walletAddress ? setView("credential") : void connectWallet()}
              >
                <WalletCards size={17} />
                {walletAddress ? "Open proof controls" : "Connect wallet"}
              </button>
            </div>
            <div className="modal-footer">
              <button
                className="button subtle"
                type="button"
                onClick={() => {
                  clearCase();
                  setMerchantOpen(false);
                }}
              >
                Reset case
              </button>
              <button
                className="button primary"
                type="button"
                onClick={() => {
                  if (!records.length) loadSample();
                  setView("workbench");
                  setMerchantOpen(false);
                }}
              >
                <Network size={17} /> Open evidence
              </button>
            </div>
          </section>
        </div>
      )}

      {walletNotice && (
        <div className="wallet-toast" role="status">
          <WalletCards size={18} />
          <span>{walletNotice}</span>
          <button type="button" onClick={() => setWalletNotice("")} title="Dismiss wallet message">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

type WalletProvider = {
  isSolflare?: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey?: { toString(): string } }>;
  signAndSendTransaction?: (transaction: unknown) => Promise<string | { signature: string }>;
  signTransaction?: (transaction: unknown) => Promise<{ serialize(): Uint8Array }>;
};

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="metric">
      <div className="metric-head"><span>{label}</span><Icon size={18} /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Status({ status }: { status: RevenueEvent["status"] }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {status === "verified" ? "Verified" : status === "supported" ? "Supported" : "Unmatched"}
    </span>
  );
}

function EmptyState({ onLoad, onImport }: { onLoad(): void; onImport(): void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Network size={28} /></div>
      <h3>No commerce graph yet</h3>
      <p>Import real records or load the pilot case to see evidence reconciliation working.</p>
      <div>
        <button className="button primary" type="button" onClick={onLoad}><Sparkles size={17} /> Load pilot case</button>
        <button className="button subtle" type="button" onClick={onImport}><FileUp size={17} /> Import data</button>
      </div>
    </div>
  );
}

function ConsentToggle({
  checked,
  onChange,
  label,
  detail,
}: {
  checked: boolean;
  onChange(value: boolean): void;
  label: string;
  detail: string;
}) {
  return (
    <label className="consent-row">
      <span className={checked ? "toggle on" : "toggle"}><i /></span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function ChainStep({
  done,
  icon: Icon,
  label,
  value,
}: {
  done: boolean;
  icon: typeof FileCheck2;
  label: string;
  value: string;
}) {
  return (
    <div className="chain-step">
      <span className={done ? "done" : ""}>{done ? <Check size={16} /> : <Icon size={16} />}</span>
      <div><strong>{label}</strong><code>{value}</code></div>
    </div>
  );
}
