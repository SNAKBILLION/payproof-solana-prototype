import { Connection } from "@solana/web3.js";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const MAX_ENCODED_PROOF_LENGTH = 16_384;
const MAX_CONSENT_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;
const ISSUANCE_CLOCK_SKEW_SECONDS = 5 * 60;

export type CredentialPayload = {
  schema: "payproof.invisible-commerce.v3";
  credentialId: string;
  subject: {
    id: string;
    name: string;
  };
  purpose: "working-capital-second-look";
  evidenceRoot: string;
  policy: {
    id: "working-capital-second-look.v1";
    decision: string;
    checksPassed: number;
    checksTotal: number;
  };
  claims: {
    revenueThreshold?: boolean;
    stableRevenue?: boolean;
    sourceDiversity?: number;
    observedMonths: number;
    evidenceConfidence: number;
  };
  issuedAt: string;
  expiresAt: string;
};

export type ProofPackage = {
  protocol: "PayProof";
  version: 3;
  network: "devnet";
  payload: CredentialPayload;
  commitment: string;
  issuer: string;
  transaction: string;
};

export type VerificationCheck = {
  id: "payload" | "transaction" | "memo" | "signer" | "time" | "expiry";
  label: string;
  detail: string;
  pass: boolean;
};

export type VerificationResult = {
  status: "idle" | "checking" | "valid" | "expired" | "tampered" | "unavailable";
  checkedAt: string;
  slot?: number;
  blockTime?: number | null;
  checks: VerificationCheck[];
  error?: string;
};

type AnchoredMemo = {
  format: "compact" | "legacy";
  commitment: string;
  evidenceRoot: string;
  expiresAtSeconds: number;
  credentialId?: string;
  issuer?: string;
  issuedAt?: string;
  schema?: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const item = (value as Record<string, unknown>)[key];
        if (item !== undefined) result[key] = canonicalize(item);
        return result;
      }, {});
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function credentialCommitment(payload: CredentialPayload) {
  return sha256(canonicalJson(payload));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBoundedString(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function isSha256(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isBase58(value: unknown, min: number, max: number) {
  return typeof value === "string" &&
    value.length >= min &&
    value.length <= max &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

function isFiniteInteger(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function assertProofPackage(value: unknown): asserts value is ProofPackage {
  if (!isRecord(value) || value.protocol !== "PayProof" || value.version !== 3 || value.network !== "devnet") {
    throw new Error("This is not a supported PayProof credential.");
  }

  const payload = value.payload;
  if (
    !isRecord(payload) ||
    payload.schema !== "payproof.invisible-commerce.v3" ||
    payload.purpose !== "working-capital-second-look" ||
    !isBoundedString(payload.credentialId, 4, 96) ||
    !isSha256(payload.evidenceRoot) ||
    !isRecord(payload.subject) ||
    !isBoundedString(payload.subject.id, 3, 128) ||
    !isBoundedString(payload.subject.name, 1, 128) ||
    !isRecord(payload.policy) ||
    payload.policy.id !== "working-capital-second-look.v1" ||
    !isBoundedString(payload.policy.decision, 1, 64) ||
    !isFiniteInteger(payload.policy.checksPassed, 0, 100) ||
    !isFiniteInteger(payload.policy.checksTotal, 1, 100) ||
    (payload.policy.checksPassed as number) > (payload.policy.checksTotal as number) ||
    !isRecord(payload.claims) ||
    !isFiniteInteger(payload.claims.observedMonths, 0, 120) ||
    !isFiniteInteger(payload.claims.evidenceConfidence, 0, 100) ||
    !isSha256(value.commitment) ||
    !isBase58(value.issuer, 32, 44) ||
    !isBase58(value.transaction, 64, 96)
  ) {
    throw new Error("The PayProof credential is malformed or incomplete.");
  }

  if (
    payload.claims.revenueThreshold !== undefined &&
    typeof payload.claims.revenueThreshold !== "boolean"
  ) {
    throw new Error("The revenue-threshold claim is malformed.");
  }
  if (
    payload.claims.stableRevenue !== undefined &&
    typeof payload.claims.stableRevenue !== "boolean"
  ) {
    throw new Error("The revenue-stability claim is malformed.");
  }
  if (
    payload.claims.sourceDiversity !== undefined &&
    !isFiniteInteger(payload.claims.sourceDiversity, 0, 32)
  ) {
    throw new Error("The source-diversity claim is malformed.");
  }

  const issuedAt = Date.parse(String(payload.issuedAt));
  const expiresAt = Date.parse(String(payload.expiresAt));
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_CONSENT_WINDOW_MS
  ) {
    throw new Error("The PayProof consent window is invalid.");
  }
}

export function encodeProofPackage(proof: ProofPackage) {
  assertProofPackage(proof);
  const bytes = new TextEncoder().encode(canonicalJson(proof));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeProofPackage(value: string): ProofPackage {
  if (!value || value.length > MAX_ENCODED_PROOF_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("The verification link is invalid or too large.");
  }
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const proof = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    assertProofPackage(proof);
    return proof;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The PayProof")) throw error;
    throw new Error("The verification link could not be decoded.");
  }
}

export function proofShareUrl(proof: ProofPackage) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#proof=${encodeProofPackage(proof)}`;
}

export function proofMemo(proof: Pick<ProofPackage, "commitment"> & { payload: CredentialPayload }) {
  return canonicalJson({
    c: proof.commitment,
    p: "PP3",
    r: proof.payload.evidenceRoot,
    x: Math.floor(Date.parse(proof.payload.expiresAt) / 1000),
  });
}

function parseMemo(value: string): AnchoredMemo | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) return null;
    if (
      parsed.p === "PP3" &&
      isSha256(parsed.c) &&
      isSha256(parsed.r) &&
      isFiniteInteger(parsed.x, 1, 4_102_444_800)
    ) {
      return {
        format: "compact",
        commitment: parsed.c,
        evidenceRoot: parsed.r,
        expiresAtSeconds: parsed.x,
      };
    }
    if (
      parsed.protocol === "PayProof" &&
      isSha256(parsed.commitment) &&
      isSha256(parsed.evidenceRoot) &&
      typeof parsed.expiresAt === "string"
    ) {
      const expiresAtSeconds = Math.floor(Date.parse(parsed.expiresAt) / 1000);
      if (!Number.isFinite(expiresAtSeconds)) return null;
      return {
        format: "legacy",
        commitment: parsed.commitment,
        evidenceRoot: parsed.evidenceRoot,
        expiresAtSeconds,
        credentialId: typeof parsed.credentialId === "string" ? parsed.credentialId : undefined,
        issuer: typeof parsed.issuer === "string" ? parsed.issuer : undefined,
        issuedAt: typeof parsed.issuedAt === "string" ? parsed.issuedAt : undefined,
        schema: typeof parsed.schema === "string" ? parsed.schema : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function memoMatchesProof(value: string, proof: ProofPackage) {
  const memo = parseMemo(value);
  if (!memo) return false;
  const payload = proof.payload;
  const baseMatch =
    memo.commitment === proof.commitment &&
    memo.evidenceRoot === payload.evidenceRoot &&
    memo.expiresAtSeconds === Math.floor(Date.parse(payload.expiresAt) / 1000);
  if (!baseMatch) return false;
  if (memo.format === "compact") return true;
  return (
    memo.credentialId === payload.credentialId &&
    memo.issuer === proof.issuer &&
    memo.issuedAt === payload.issuedAt &&
    memo.schema === payload.schema
  );
}

function memoText(parsed: unknown) {
  if (typeof parsed === "string") return parsed;
  if (!parsed || typeof parsed !== "object") return "";
  const candidate = parsed as { info?: unknown };
  if (typeof candidate.info === "string") return candidate.info;
  if (candidate.info && typeof candidate.info === "object") {
    const info = candidate.info as { memo?: unknown };
    if (typeof info.memo === "string") return info.memo;
  }
  return "";
}

function unavailableChecks(payloadPass: boolean, expiryPass: boolean): VerificationCheck[] {
  return [
    { id: "payload", label: "Credential integrity", detail: payloadPass ? "Commitment recomputed" : "Commitment mismatch", pass: payloadPass },
    { id: "transaction", label: "Solana receipt", detail: "Finalized transaction is not available from devnet RPC", pass: false },
    { id: "memo", label: "On-chain commitment", detail: "Waiting for finalized transaction data", pass: false },
    { id: "signer", label: "Issuer authority", detail: "Signer could not be checked", pass: false },
    { id: "time", label: "Issuance time", detail: "Block time could not be checked", pass: false },
    { id: "expiry", label: "Consent window", detail: expiryPass ? "Credential has not expired" : "Credential expired", pass: expiryPass },
  ];
}

export async function verifyProofPackage(proof: ProofPackage): Promise<VerificationResult> {
  const checkedAt = new Date().toISOString();
  try {
    assertProofPackage(proof);
  } catch (error) {
    return {
      status: "tampered",
      checkedAt,
      error: (error as Error).message,
      checks: [
        { id: "payload", label: "Credential integrity", detail: (error as Error).message, pass: false },
      ],
    };
  }

  const localCommitment = await credentialCommitment(proof.payload);
  const payloadPass = localCommitment === proof.commitment;
  const expiryPass = Date.parse(proof.payload.expiresAt) > Date.now();

  try {
    const connection = new Connection(DEVNET_RPC, "finalized");
    const transaction = await connection.getParsedTransaction(proof.transaction, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return {
        status: "unavailable",
        checkedAt,
        checks: unavailableChecks(payloadPass, expiryPass),
      };
    }

    const transactionPass = transaction.meta?.err === null;
    const memoInstructions = transaction.transaction.message.instructions.filter(
      (item) => item.programId.toBase58() === MEMO_PROGRAM_ID,
    );
    const memoPass = memoInstructions.some((instruction) => {
      const parsed = "parsed" in instruction ? memoText(instruction.parsed) : "";
      return parsed ? memoMatchesProof(parsed, proof) : false;
    });
    const signerPass = transaction.transaction.message.accountKeys.some(
      (account) => account.signer && account.pubkey.toBase58() === proof.issuer,
    );
    const issuedAtSeconds = Math.floor(Date.parse(proof.payload.issuedAt) / 1000);
    const expiresAtSeconds = Math.floor(Date.parse(proof.payload.expiresAt) / 1000);
    const blockTime = transaction.blockTime;
    const timePass =
      typeof blockTime === "number" &&
      Math.abs(blockTime - issuedAtSeconds) <= ISSUANCE_CLOCK_SKEW_SECONDS &&
      blockTime < expiresAtSeconds;

    const checks: VerificationCheck[] = [
      { id: "payload", label: "Credential integrity", detail: payloadPass ? "Displayed claims recompute to the commitment" : "Displayed claims were changed", pass: payloadPass },
      { id: "transaction", label: "Solana receipt", detail: transactionPass ? `Finalized in slot ${transaction.slot}` : "Transaction failed", pass: transactionPass },
      { id: "memo", label: "On-chain commitment", detail: memoPass ? "Matching PayProof commitment found in the transaction" : "No matching PayProof commitment was found", pass: memoPass },
      { id: "signer", label: "Issuer authority", detail: signerPass ? "Issuer wallet signed the receipt" : "Issuer signer mismatch", pass: signerPass },
      { id: "time", label: "Issuance time", detail: timePass ? "Credential issuance matches finalized block time" : "Credential time does not match its receipt", pass: timePass },
      { id: "expiry", label: "Consent window", detail: expiryPass ? `Valid until ${proof.payload.expiresAt}` : "Credential expired", pass: expiryPass },
    ];
    const authenticityPass = checks.slice(0, 5).every((check) => check.pass);
    return {
      status: !authenticityPass ? "tampered" : expiryPass ? "valid" : "expired",
      checkedAt,
      slot: transaction.slot,
      blockTime,
      checks,
    };
  } catch (error) {
    return {
      status: "unavailable",
      checkedAt,
      error: (error as Error).message,
      checks: unavailableChecks(payloadPass, expiryPass),
    };
  }
}
