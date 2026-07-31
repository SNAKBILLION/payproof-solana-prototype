import crypto from "node:crypto";
import fs from "node:fs/promises";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const root =
  "C:/Users/accounts3/.codex/visualizations/2026/07/29/019fad9e-e9c5-7942-9864-3a11f8fe7290";
const sampleFiles = [
  "orders.csv",
  "invoices.csv",
  "bank-credits.csv",
  "upi-settlements.csv",
];

const parts = await Promise.all(
  sampleFiles.map((file) => fs.readFile(`${root}/public/samples/${file}`)),
);
const commitment = crypto
  .createHash("sha256")
  .update(Buffer.concat(parts))
  .digest("hex");

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const issuer = Keypair.generate();
const airdrop = await connection.requestAirdrop(
  issuer.publicKey,
  1_000_000,
);
await connection.confirmTransaction(airdrop, "confirmed");

const memoProgram = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);
const memo = JSON.stringify({
  app: "PayProof",
  schema: "commerce-proof-v2",
  case: "PP-2048",
  commitment,
  records: 28,
  events: 13,
  network: "devnet",
});

const transaction = new Transaction().add(
  new TransactionInstruction({
    keys: [],
    programId: memoProgram,
    data: Buffer.from(memo, "utf8"),
  }),
);

const signature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [issuer],
  { commitment: "confirmed" },
);
const status = await connection.getSignatureStatus(signature, {
  searchTransactionHistory: true,
});
const receipt = {
  createdAt: new Date().toISOString(),
  network: "devnet",
  clusterUrl: "https://api.devnet.solana.com",
  program: memoProgram.toBase58(),
  issuer: issuer.publicKey.toBase58(),
  signature,
  confirmationStatus: status.value?.confirmationStatus ?? null,
  error: status.value?.err ?? null,
  commitment,
  sampleRecords: 28,
  reconciledEvents: 13,
  explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  note:
    "Automated release proof. The ephemeral issuer secret key was never persisted.",
};

await fs.writeFile(
  `${root}/artifacts/solana-devnet-receipt.json`,
  `${JSON.stringify(receipt, null, 2)}\n`,
);
console.log(JSON.stringify(receipt, null, 2));
