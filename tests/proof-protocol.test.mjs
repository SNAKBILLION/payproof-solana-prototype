import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalJson,
  credentialCommitment,
  decodeProofPackage,
  encodeProofPackage,
  proofMemo,
} from "../app/proof-protocol.ts";

const payload = {
  schema: "payproof.invisible-commerce.v3",
  credentialId: "pp_test",
  subject: { id: "merchant:test", name: "Test Merchant" },
  purpose: "working-capital-second-look",
  evidenceRoot: "root123",
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

test("canonical credential commitments ignore object key order", async () => {
  const reordered = { ...payload, subject: { name: "Test Merchant", id: "merchant:test" } };
  assert.equal(canonicalJson(payload), canonicalJson(reordered));
  assert.equal(await credentialCommitment(payload), await credentialCommitment(reordered));
});

test("proof packages round-trip through a URL-safe encoding", async () => {
  const commitment = await credentialCommitment(payload);
  const proof = {
    protocol: "PayProof",
    version: 3,
    network: "devnet",
    payload,
    commitment,
    issuer: "issuer123",
    transaction: "transaction123",
  };
  assert.deepEqual(decodeProofPackage(encodeProofPackage(proof)), proof);
  const memo = JSON.parse(proofMemo(proof));
  assert.equal(memo.commitment, commitment);
  assert.equal(memo.evidenceRoot, payload.evidenceRoot);
  assert.equal(memo.expiresAt, payload.expiresAt);
});
