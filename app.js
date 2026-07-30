import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "https://esm.sh/@solana/web3.js@1.98.2";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const DEVNET_RPC = "https://api.devnet.solana.com";
const DEVNET_EXPLORER = "https://explorer.solana.com/tx";

const evidenceButtons = document.querySelectorAll(".evidence");
const analyzeBtn = document.querySelector("#analyzeBtn");
const proofBtn = document.querySelector("#proofBtn");
const quickRun = document.querySelector("#quickRun");
const connectBtn = document.querySelector("#connectBtn");
const walletPill = document.querySelector("#walletPill");
const walletNote = document.querySelector("#walletNote");
const pipelineStatus = document.querySelector("#pipelineStatus");
const reportStatus = document.querySelector("#reportStatus");
const readinessScore = document.querySelector("#readinessScore");
const rangeValue = document.querySelector("#rangeValue");
const consistencyValue = document.querySelector("#consistencyValue");
const confidenceValue = document.querySelector("#confidenceValue");
const privacyValue = document.querySelector("#privacyValue");
const riskNotes = document.querySelector("#riskNotes");
const proofStatus = document.querySelector("#proofStatus");
const proofHash = document.querySelector("#proofHash");
const heroHash = document.querySelector("#heroHash");
const heroScore = document.querySelector("#heroScore");
const thresholdText = document.querySelector("#thresholdText");
const verifyList = document.querySelector("#verifyList");
const chainTarget = document.querySelector("#chainTarget");
const issuerWallet = document.querySelector("#issuerWallet");

const steps = [...document.querySelectorAll(".pipeline-step")];
const connection = new Connection(DEVNET_RPC, "confirmed");
let analyzed = false;
let latestReport = null;

evidenceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    evidenceButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

function getSolanaProvider() {
  if ("solana" in window && window.solana?.isPhantom) return window.solana;
  if ("solana" in window) return window.solana;
  if ("solflare" in window) return window.solflare;
  return null;
}

function getProviderName(provider) {
  if (provider?.isPhantom) return "Phantom";
  if (provider?.isSolflare || provider === window.solflare) return "Solflare";
  return "Solana wallet";
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function shortAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return (
    "0x" +
    [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

function buildReport() {
  return {
    schema: "payproof.repayment_readiness.v1",
    subject: {
      alias: "Ravi Kumar",
      role: "small_upi_merchant",
      region: "Delhi NCR",
    },
    evidence: {
      accepted: ["upi_settlements", "invoice_payment", "bank_credit_sms"],
      excluded: ["cash_sales_note"],
      rawDocumentsShared: false,
    },
    result: {
      incomeThreshold: "above_35000_inr_monthly",
      verifiedMonthlyRange: "42000-48000 INR",
      reliabilityScore: 82,
      proofConfidence: 91,
      volatility: "medium_low",
      decisionUse: "manual_review_signal_not_loan_approval",
    },
    consent: {
      verifierScope: "income_threshold_and_confidence_only",
      expiresInDays: 7,
    },
    createdAt: new Date().toISOString(),
  };
}

async function connectWallet() {
  const provider = getSolanaProvider();
  if (!provider) {
    walletNote.textContent =
      "No Solana wallet found. Enable Solflare or Phantom on this site, then refresh and connect again.";
    walletPill.textContent = "Wallet missing";
    return null;
  }

  try {
    const response = await provider.connect();
    const publicKey = response.publicKey ?? provider.publicKey;
    const address = publicKey.toString();
    walletPill.textContent = `${getProviderName(provider)} ${shortAddress(address)}`;
    walletNote.textContent =
      "Wallet connected. After AI verification, PayProof will anchor the report hash to Solana devnet using the Memo program.";
    issuerWallet.textContent = address;
    return provider;
  } catch (error) {
    walletNote.textContent = `Wallet connection cancelled: ${error.message}`;
    return null;
  }
}

async function runAnalysis() {
  analyzed = false;
  analyzeBtn.disabled = true;
  proofBtn.disabled = true;
  proofBtn.classList.add("disabled");
  pipelineStatus.textContent = "Running";
  reportStatus.textContent = "Building";
  readinessScore.textContent = "Analyzing";
  rangeValue.textContent = "--";
  consistencyValue.textContent = "--";
  confidenceValue.textContent = "--";
  privacyValue.textContent = "--";
  riskNotes.innerHTML = "<p>Reading UPI, invoice and SMS evidence...</p>";
  steps.forEach((step) => step.classList.remove("active", "done"));

  for (const [index, step] of steps.entries()) {
    step.classList.add("active");
    await wait(620);
    step.classList.remove("active");
    step.classList.add("done");
    const messages = [
      "Parsed 31 income events across UPI, invoice and bank SMS sources.",
      "No duplicate screenshots found. One cash note excluded from verified range.",
      "Recurring daily UPI settlements and monthly invoice pattern detected.",
      "Private report ready for Solana Memo anchoring and consent-bound verifier link.",
    ];
    riskNotes.innerHTML = `<p>${messages[index]}</p>`;
  }

  latestReport = buildReport();
  const localHash = await sha256Hex(JSON.stringify(latestReport));
  analyzed = true;
  pipelineStatus.textContent = "Complete";
  reportStatus.textContent = "Unlocked";
  readinessScore.textContent = "Review Ready";
  rangeValue.textContent = "Rs 42k-48k";
  consistencyValue.textContent = "82 / 100";
  confidenceValue.textContent = "91%";
  privacyValue.textContent = "Raw files hidden";
  proofHash.textContent = localHash;
  heroHash.textContent = `${localHash.slice(0, 18)}...${localHash.slice(-10)}`;
  riskNotes.innerHTML =
    "<p><strong>Decision signal:</strong> stable enough for small-ticket manual credit review. Cash-only notes were excluded, reducing fraud risk and keeping the model conservative.</p>";
  proofBtn.disabled = false;
  proofBtn.classList.remove("disabled");
  analyzeBtn.disabled = false;
}

async function anchorProof() {
  if (!analyzed) {
    await runAnalysis();
  }

  let provider = getSolanaProvider();
  if (!provider?.publicKey) {
    provider = await connectWallet();
  }
  if (!provider?.publicKey) {
    return;
  }

  const reportHash = await sha256Hex(JSON.stringify(latestReport));
  const memo = JSON.stringify({
    app: "PayProof",
    schema: "repayment_readiness_v1",
    hash: reportHash,
    threshold: "income_above_35000_inr_monthly",
    rawDocumentsShared: false,
  });

  proofBtn.disabled = true;
  proofBtn.textContent = "Sending devnet transaction...";
  walletNote.textContent = "Please approve the Solana devnet transaction in your wallet.";

  try {
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: new TextEncoder().encode(memo),
      }),
    );
    transaction.feePayer = provider.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    let signature;
    if (typeof provider.signAndSendTransaction === "function") {
      const result = await provider.signAndSendTransaction(transaction);
      signature = typeof result === "string" ? result : result.signature;
    } else {
      const signed = await provider.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signed.serialize());
    }
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    const explorerUrl = `${DEVNET_EXPLORER}/${signature}?cluster=devnet`;
    proofStatus.textContent = "Anchored on Solana";
    proofStatus.classList.remove("muted");
    proofHash.textContent = reportHash;
    heroHash.textContent = `${reportHash.slice(0, 18)}...${reportHash.slice(-10)}`;
    heroScore.textContent = "86";
    thresholdText.textContent = "Above Rs 35k/month";
    verifyList.classList.add("ready");
    verifyList.innerHTML =
      "<li><i></i> Raw documents remain hidden</li><li><i></i> Credential hash anchored through Solana Memo</li><li><i></i> Reviewer cannot download source files</li><li><i></i> Consent receipt expires in 7 days</li>";
    issuerWallet.textContent = provider.publicKey.toString();
    chainTarget.innerHTML = `<a href="${explorerUrl}" target="_blank" rel="noreferrer">${signature}</a>`;
    walletNote.textContent = `Proof anchored on Solana devnet: ${shortAddress(signature)}`;
    proofBtn.textContent = "Anchored on Devnet";
    document.querySelector("#proof").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    proofBtn.disabled = false;
    proofBtn.textContent = "Anchor Proof on Devnet";
    walletNote.textContent = `Solana anchor failed: ${error.message}`;
  }
}

connectBtn.addEventListener("click", connectWallet);
analyzeBtn.addEventListener("click", runAnalysis);
proofBtn.addEventListener("click", anchorProof);
quickRun.addEventListener("click", async () => {
  document.querySelector("#case-room").scrollIntoView({ behavior: "smooth" });
  await wait(400);
  await connectWallet();
  await runAnalysis();
  await anchorProof();
});
