import { Connection } from "@solana/web3.js";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

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
  id: "payload" | "transaction" | "memo" | "signer" | "expiry";
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

export function encodeProofPackage(proof: ProofPackage) {
  const bytes = new TextEncoder().encode(canonicalJson(proof));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeProofPackage(value: string): ProofPackage {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const proof = JSON.parse(new TextDecoder().decode(bytes)) as ProofPackage;
  if (
    proof.protocol !== "PayProof" ||
    proof.version !== 3 ||
    proof.network !== "devnet" ||
    !proof.payload ||
    !proof.commitment ||
    !proof.issuer ||
    !proof.transaction
  ) {
    throw new Error("This is not a supported PayProof credential.");
  }
  return proof;
}

export function proofShareUrl(proof: ProofPackage) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#proof=${encodeProofPackage(proof)}`;
}

export function proofMemo(proof: Pick<ProofPackage, "commitment" | "issuer"> & { payload: CredentialPayload }) {
  return canonicalJson({
    protocol: "PayProof",
    schema: proof.payload.schema,
    credentialId: proof.payload.credentialId,
    commitment: proof.commitment,
    evidenceRoot: proof.payload.evidenceRoot,
    issuer: proof.issuer,
    issuedAt: proof.payload.issuedAt,
    expiresAt: proof.payload.expiresAt,
  });
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

export async function verifyProofPackage(proof: ProofPackage): Promise<VerificationResult> {
  const checkedAt = new Date().toISOString();
  const localCommitment = await credentialCommitment(proof.payload);
  const payloadPass = localCommitment === proof.commitment;
  const expiryPass = Date.parse(proof.payload.expiresAt) > Date.now();

  try {
    const connection = new Connection(DEVNET_RPC, "confirmed");
    const transaction = await connection.getParsedTransaction(proof.transaction, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return {
        status: "unavailable",
        checkedAt,
        checks: [
          { id: "payload", label: "Credential integrity", detail: payloadPass ? "Commitment recomputed" : "Commitment mismatch", pass: payloadPass },
          { id: "transaction", label: "Solana receipt", detail: "Transaction is not available from devnet RPC", pass: false },
          { id: "memo", label: "On-chain commitment", detail: "Waiting for transaction data", pass: false },
          { id: "signer", label: "Issuer authority", detail: "Signer could not be checked", pass: false },
          { id: "expiry", label: "Consent window", detail: expiryPass ? `Valid until ${proof.payload.expiresAt}` : "Credential expired", pass: expiryPass },
        ],
      };
    }

    const transactionPass = transaction.meta?.err === null;
    const instruction = transaction.transaction.message.instructions.find(
      (item) => item.programId.toBase58() === MEMO_PROGRAM_ID,
    );
    const parsedMemo = instruction && "parsed" in instruction ? memoText(instruction.parsed) : "";
    let anchored: Record<string, unknown> | null = null;
    try {
      anchored = parsedMemo ? JSON.parse(parsedMemo) as Record<string, unknown> : null;
    } catch {
      anchored = null;
    }
    const memoPass = Boolean(
      anchored &&
      anchored.protocol === "PayProof" &&
      anchored.commitment === proof.commitment &&
      anchored.evidenceRoot === proof.payload.evidenceRoot &&
      anchored.credentialId === proof.payload.credentialId &&
      anchored.expiresAt === proof.payload.expiresAt,
    );
    const signerPass = transaction.transaction.message.accountKeys.some(
      (account) => account.signer && account.pubkey.toBase58() === proof.issuer,
    );
    const checks: VerificationCheck[] = [
      { id: "payload", label: "Credential integrity", detail: payloadPass ? "Displayed claims recompute to the commitment" : "Displayed claims were changed", pass: payloadPass },
      { id: "transaction", label: "Solana receipt", detail: transactionPass ? `Confirmed in slot ${transaction.slot}` : "Transaction failed", pass: transactionPass },
      { id: "memo", label: "On-chain commitment", detail: memoPass ? "Memo matches this credential and evidence root" : "Memo does not match this credential", pass: memoPass },
      { id: "signer", label: "Issuer authority", detail: signerPass ? "Issuer wallet signed the receipt" : "Issuer signer mismatch", pass: signerPass },
      { id: "expiry", label: "Consent window", detail: expiryPass ? `Valid until ${proof.payload.expiresAt}` : "Credential expired", pass: expiryPass },
    ];
    const cryptographicChecksPass = checks.slice(0, 4).every((check) => check.pass);
    return {
      status: !cryptographicChecksPass ? "tampered" : expiryPass ? "valid" : "expired",
      checkedAt,
      slot: transaction.slot,
      blockTime: transaction.blockTime,
      checks,
    };
  } catch (error) {
    return {
      status: "unavailable",
      checkedAt,
      error: (error as Error).message,
      checks: [
        { id: "payload", label: "Credential integrity", detail: payloadPass ? "Commitment recomputed" : "Commitment mismatch", pass: payloadPass },
        { id: "transaction", label: "Solana receipt", detail: "Devnet RPC could not be reached", pass: false },
        { id: "memo", label: "On-chain commitment", detail: "Not checked", pass: false },
        { id: "signer", label: "Issuer authority", detail: "Not checked", pass: false },
        { id: "expiry", label: "Consent window", detail: expiryPass ? `Valid until ${proof.payload.expiresAt}` : "Credential expired", pass: expiryPass },
      ],
    };
  }
}
