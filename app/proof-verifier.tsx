"use client";

import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CircleAlert,
  Copy,
  Download,
  FileCheck2,
  GitMerge,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type ProofPackage,
  type VerificationResult,
  proofShareUrl,
  verifyProofPackage,
} from "./proof-protocol";

type Props = {
  proof: ProofPackage | null;
  external?: boolean;
  onBack?(): void;
};

const STATUS_COPY: Record<VerificationResult["status"], { label: string; detail: string }> = {
  idle: { label: "Credential pending", detail: "Anchor a proof before sharing it with a lender." },
  checking: { label: "Checking on Solana", detail: "Recomputing the credential and reading its devnet receipt." },
  valid: { label: "Independently verified", detail: "Claims, issuer signer and on-chain commitment all match." },
  expired: { label: "Consent expired", detail: "The proof is authentic, but its access window has ended." },
  tampered: { label: "Verification failed", detail: "One or more cryptographic checks do not match." },
  unavailable: { label: "Verification unavailable", detail: "The verifier could not complete every RPC check." },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProofVerifier({ proof, external = false, onBack }: Props) {
  const [result, setResult] = useState<VerificationResult>({
    status: "idle",
    checkedAt: "",
    checks: [],
  });
  const [copyLabel, setCopyLabel] = useState("Copy verification link");

  const verify = useCallback(async () => {
    if (!proof) {
      setResult({ status: "idle", checkedAt: "", checks: [] });
      return;
    }
    setResult({ status: "checking", checkedAt: "", checks: [] });
    setResult(await verifyProofPackage(proof));
  }, [proof]);

  useEffect(() => {
    void verify();
  }, [verify]);

  async function copyLink() {
    if (!proof) return;
    await navigator.clipboard.writeText(proofShareUrl(proof));
    setCopyLabel("Link copied");
    window.setTimeout(() => setCopyLabel("Copy verification link"), 1800);
  }

  function downloadProof() {
    if (!proof) return;
    const file = new Blob([JSON.stringify(proof, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payproof-${proof.payload.credentialId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const payload = proof?.payload;
  const statusCopy = STATUS_COPY[result.status];
  const statusReady = result.status === "valid";
  const statusWarning = result.status === "expired" || result.status === "unavailable";

  return (
    <section className={external ? "public-verifier" : "page-content verifier-page"}>
      {external && (
        <header className="public-verifier-bar">
          <div className="verify-brand">
            <span className="brand-symbol">P</span>
            <div><strong>PayProof Verify</strong><small>Independent Solana credential verification</small></div>
          </div>
          {onBack && (
            <button className="button subtle" type="button" onClick={onBack}>
              <ArrowLeft size={17} /> Open workspace
            </button>
          )}
        </header>
      )}

      <div className="verifier-toolbar">
        <div>
          <span className="eyebrow">Independent proof verification</span>
          <h2>Lender sees the decision evidence, not the documents.</h2>
          <p>PayProof recomputes the credential and checks its issuer-signed Solana receipt.</p>
        </div>
        {payload && <span className="access-pill"><LockKeyhole size={15} /> Expires {formatDate(payload.expiresAt)}</span>}
      </div>

      <section className="verification-sheet">
        <header>
          <div className="verify-brand">
            <span className="brand-symbol">P</span>
            <div><strong>PayProof Verify</strong><small>Cryptographic commerce evidence</small></div>
          </div>
          <span className={`verified-pill ${statusReady ? "ready" : statusWarning ? "warning" : result.status === "tampered" ? "failed" : ""}`}>
            {result.status === "checking" ? <RefreshCw className="spin" size={16} /> : statusReady ? <BadgeCheck size={16} /> : result.status === "tampered" ? <ShieldAlert size={16} /> : <CircleAlert size={16} />}
            {statusCopy.label}
          </span>
        </header>

        <div className="verify-hero">
          <div>
            <span className="panel-kicker">Merchant claim</span>
            <h3>{payload?.policy.decision ?? "No anchored credential"}</h3>
            <p>{statusCopy.detail} This is evidence for manual review, not a loan approval or bureau score.</p>
          </div>
          <div className="verify-score">
            <strong>{payload ? `${payload.policy.checksPassed}/${payload.policy.checksTotal}` : "--"}</strong>
            <span>policy checks met</span>
          </div>
        </div>

        {payload ? (
          <>
            <div className="verify-claims">
              {payload.claims.revenueThreshold !== undefined && (
                <VerifierClaim icon={Banknote} label="Revenue threshold" value={payload.claims.revenueThreshold ? "Above ₹35,000 / month" : "Threshold not met"} />
              )}
              {payload.claims.stableRevenue !== undefined && (
                <VerifierClaim icon={Activity} label="Revenue stability" value={payload.claims.stableRevenue ? "Policy condition met" : "Manual review required"} />
              )}
              {payload.claims.sourceDiversity !== undefined && (
                <VerifierClaim icon={GitMerge} label="Independent sources" value={`${payload.claims.sourceDiversity} evidence types`} />
              )}
              <VerifierClaim icon={ShieldCheck} label="Evidence confidence" value={`${payload.claims.evidenceConfidence}%`} />
            </div>

            <div className="verification-checks">
              {result.checks.map((check) => (
                <div className={check.pass ? "verification-check pass" : "verification-check fail"} key={check.id}>
                  <span>{check.pass ? <BadgeCheck size={17} /> : <CircleAlert size={17} />}</span>
                  <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                </div>
              ))}
              {result.status === "checking" && <div className="verification-loading"><RefreshCw className="spin" size={18} /> Reading Solana devnet receipt...</div>}
            </div>

            <div className="verify-audit">
              <div><span>Credential commitment</span><code>{proof.commitment}</code></div>
              <div><span>Solana receipt</span><code>{proof.transaction}</code></div>
              <div><span>Raw documents</span><strong>Unavailable by design</strong></div>
            </div>

            <div className="verifier-actions">
              {!external && (
                <button className="button primary" type="button" onClick={copyLink}>
                  <Copy size={17} /> {copyLabel}
                </button>
              )}
              <button className="button subtle" type="button" onClick={() => void verify()} disabled={result.status === "checking"}>
                <RefreshCw size={17} /> Re-check proof
              </button>
              <button className="button subtle" type="button" onClick={downloadProof}>
                <Download size={17} /> Download proof JSON
              </button>
              <a className="button subtle" href={`https://explorer.solana.com/tx/${proof.transaction}?cluster=devnet`} target="_blank" rel="noreferrer">
                <ArrowUpRight size={17} /> Open Solana receipt
              </a>
            </div>
          </>
        ) : (
          <div className="verifier-empty">
            <WalletCards size={24} />
            <strong>No anchored proof yet</strong>
            <p>Create and anchor a Proof Passport before opening the lender view.</p>
          </div>
        )}

        <footer>
          <span><ShieldCheck size={15} /> Issuer signer verified on-chain</span>
          <span><FileCheck2 size={15} /> Displayed claims recomputed</span>
          <span><LockKeyhole size={15} /> Expiry enforced at verification</span>
        </footer>
      </section>
    </section>
  );
}

function VerifierClaim({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="verifier-claim">
      <span><Icon size={18} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
      <BadgeCheck size={18} />
    </div>
  );
}
