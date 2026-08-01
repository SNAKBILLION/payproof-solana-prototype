import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_ENCODED_PROOF_LENGTH,
  canonicalJson,
  credentialCommitment,
  decodeProofPackage,
  encodeProofPackage,
  memoMatchesProof,
  proofMemo,
} from "../app/proof-protocol.ts";

const payload = {
  schema: "payproof.invisible-commerce.v3",
  credentialId: "pp_test",
  subject: { id: "merchant:test", name: "Test Merchant" },
  purpose: "working-capital-second-look",
  evidenceRoot: "a".repeat(64),
  policy: {
    id: "working-capital-second-look.v1",
    decision: "Second-look ready",
    checksPassed: 5,
    checksTotal: 5,
  },
  claims: {
    revenueThreshold: true,
    stableRevenue: true,
    observedMonths: 3,
    evidenceConfidence: 91,
  },
  issuedAt: "2026-08-01T00:00:00.000Z",
  expiresAt: "2026-08-08T00:00:00.000Z",
};

async function proofPackage() {
  return {
    protocol: "PayProof",
    version: 3,
    network: "devnet",
    payload,
    commitment: await credentialCommitment(payload),
    issuer: "1".repeat(32),
    transaction: "2".repeat(64),
  };
}

test("canonical credential commitments ignore object key order", async () => {
  const reordered = { ...payload, subject: { name: "Test Merchant", id: "merchant:test" } };
  assert.equal(canonicalJson(payload), canonicalJson(reordered));
  assert.equal(await credentialCommitment(payload), await credentialCommitment(reordered));
});

test("proof packages round-trip through a strictly validated URL-safe encoding", async () => {
  const proof = await proofPackage();
  assert.deepEqual(decodeProofPackage(encodeProofPackage(proof)), proof);
  assert.throws(
    () => decodeProofPackage("x".repeat(MAX_ENCODED_PROOF_LENGTH + 1)),
    /invalid or too large/,
  );
  const malformed = { ...proof, issuer: "not-a-solana-address" };
  const encoded = Buffer.from(JSON.stringify(malformed)).toString("base64url");
  assert.throws(() => decodeProofPackage(encoded), /malformed or incomplete/);
});

test("compact anchors retain commitment semantics with less than 200 bytes", async () => {
  const proof = await proofPackage();
  const memoText = proofMemo(proof);
  const memo = JSON.parse(memoText);
  assert.equal(memo.p, "PP3");
  assert.equal(memo.c, proof.commitment);
  assert.equal(memo.r, payload.evidenceRoot);
  assert.equal(memo.x, Date.parse(payload.expiresAt) / 1000);
  assert.ok(Buffer.byteLength(memoText, "utf8") < 200);
  assert.equal(memoMatchesProof(memoText, proof), true);
});

test("verifier accepts existing full v3 receipts and rejects substituted fields", async () => {
  const proof = await proofPackage();
  const legacyMemo = canonicalJson({
    protocol: "PayProof",
    schema: payload.schema,
    credentialId: payload.credentialId,
    commitment: proof.commitment,
    evidenceRoot: payload.evidenceRoot,
    issuer: proof.issuer,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  });
  assert.equal(memoMatchesProof(legacyMemo, proof), true);
  assert.equal(
    memoMatchesProof(legacyMemo.replace(proof.issuer, "3".repeat(32)), proof),
    false,
  );
  assert.equal(
    memoMatchesProof(proofMemo(proof).replace(proof.commitment, "b".repeat(64)), proof),
    false,
  );
});
