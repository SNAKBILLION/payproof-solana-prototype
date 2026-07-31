# PayProof

**Invisible commerce, verified.**

PayProof turns fragmented orders, invoices, UPI settlements and bank credits into
explainable, privacy-safe evidence for working-capital review.

## Why this exists

Small merchants often have real commerce but weak documentation. Their activity
lives across WhatsApp orders, invoice files, payment apps and bank credits.
PayProof reconciles those records into revenue events without creating a generic
credit score or giving a lender access to the merchant's raw financial history.

## Working product

- Import CSV or JSON records from four evidence sources.
- Normalize and reconcile records into cross-source revenue events.
- Preserve the provenance chain and confidence for every event.
- Run a replayable lender policy with explicit pass/fail reasons.
- Generate a purpose-bound proof passport with merchant-controlled disclosure.
- Hash source evidence into a Merkle root and SHA-256 credential commitment.
- Show a verifier only the allowed claims, never the raw source records.
- Connect Phantom or Solflare and anchor the commitment through Solana Memo on devnet.

## Submission kit

- Live product: https://snakbillion.github.io/payproof-solana-prototype/
- Sample evidence bundle:
  https://snakbillion.github.io/payproof-solana-prototype/samples/payproof-pilot-evidence.zip
- 90-second product demo:
  https://snakbillion.github.io/payproof-solana-prototype/downloads/PayProof-90s-Demo.mp4
- Six-slide grant deck:
  https://snakbillion.github.io/payproof-solana-prototype/downloads/PayProof-Grant-Deck.pptx
- Funding applications: [APPLICATION_PACK.md](APPLICATION_PACK.md)
- Demo narration: [artifacts/DEMO_SCRIPT.md](artifacts/DEMO_SCRIPT.md)

## Product flow

1. Load the pilot case or import local CSV/JSON evidence.
2. Review verified, supported and unmatched commerce events.
3. Run the working-capital second-look policy.
4. Choose claims and consent expiry.
5. Generate the private commitment.
6. Open the lender view.
7. Optionally connect a Solana wallet and anchor the commitment on devnet.

## Local development

```bash
pnpm install
pnpm dev
```

Production checks:

```bash
pnpm build
pnpm test
pnpm lint
```

## Import schema

PayProof accepts flexible CSV/JSON field names. A canonical row looks like:

```json
{
  "id": "ORD-1042",
  "source": "order",
  "timestamp": "2026-06-28T10:30:00.000Z",
  "amount": 12600,
  "counterparty": "Field Office Co",
  "reference": "FO-126"
}
```

Valid source values are `order`, `invoice`, `bank` and `settlement`. Imported
files are processed in the browser and are not uploaded by the current product.

## Architecture

```mermaid
flowchart LR
  A[Orders] --> E[Evidence normalizer]
  B[Invoices] --> E
  C[UPI settlements] --> E
  D[Bank credits] --> E
  E --> F[Revenue event graph]
  F --> G[Explainable policy engine]
  G --> H[Consent-bound proof passport]
  H --> I[Lender verifier]
  H --> J[Solana commitment]
```

## Trust boundaries

PayProof is not a lender, bureau score or automatic approval engine. It creates
decision evidence for human review. Raw evidence remains off-chain; only a
credential commitment and minimal proof metadata are written to Solana.

## Current scope

This repository contains a production-grade browser application and a real Solana
devnet transaction path. A full deployment should add authenticated case storage,
issuer key management, revocation, lender organizations and repayment outcome
attestations.
