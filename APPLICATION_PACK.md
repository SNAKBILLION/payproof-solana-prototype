# PayProof Funding Application Pack

Verified on 1 August 2026. Submit only through the two active routes below.

## Submission order

1. Agentic Engineering Grant: submit first for the seven-day shipping milestone.
2. Solana Foundation India Grant: submit after the Agentic application is recorded.
3. Do not submit to Colosseum Eternal while the official page says it is paused.
4. Do not duplicate the India proposal in the global Foundation form. Revisit the
   global convertible grant after a lender pilot letter and measurable merchant usage.

## 1. Agentic Engineering Grant

**Status:** Active, global, 200 USDG, listed average response time of one week.

**Apply:** https://superteam.fun/earn/grants/agentic-engineering/

### One-liner

AI-assisted private commerce proofs on Solana.

### What has already shipped

PayProof is a live Solana product for thin-file merchants. It imports fragmented
orders, invoices, bank credits and UPI settlements, reconciles them into a
provenance graph, runs an explainable lender policy, generates a
selective-disclosure credential, and anchors a compact commitment on Solana
devnet. The public verifier independently checks the commitment, issuer signer,
finalized receipt and consent expiry without exposing raw financial documents.

### Seven-day deliverable

Use the grant for one month of an advanced AI coding tool and ship the PayProof
Evidence Import QA Pack:

1. Add adversarial CSV fixtures for duplicate, malformed and conflicting records.
2. Add automatic field mapping diagnostics and visible rejection reasons.
3. Add reconciliation regression tests for payer, amount and date tolerances.
4. Publish a short technical build log and an independently verifiable devnet proof.
5. Keep the implementation and test corpus MIT licensed.

### Proof of work

- Product: https://snakbillion.github.io/payproof-solana-prototype/
- Source: https://github.com/SNAKBILLION/payproof-solana-prototype
- CI: https://github.com/SNAKBILLION/payproof-solana-prototype/actions
- Devnet receipt:
  https://explorer.solana.com/tx/2ieUAnQb5ydKo9VyACzgXUAncfbB4Db04ciJBbs1HMXX2fGqQW66xQY82yK3hAFf7i9jhQEHB1ZqRbvSuPy1CiPN?cluster=devnet
- Demo:
  https://snakbillion.github.io/payproof-solana-prototype/downloads/PayProof-90s-Demo.mp4

### Completion evidence

A reviewer can import the adversarial fixtures, inspect accepted and rejected
records, run the decision policy, create a credential, and verify the resulting
Solana receipt. CI must pass lint, protocol tests, rendered-app tests, build,
deployment and live asset smoke checks.

## 2. Solana Foundation India Grant

**Status:** Active regional grant for India, up to 10,000 USDG, listed average
response time of 30 days. Superteam Earn KYC is mandatory before payment.

**Recommended request:** 5,000 USDG. This is close to the listing's current
average grant size and is proportional to PayProof's present pilot stage.

**Apply:** https://superteam.fun/earn/grants/solana-foundation-india-grants/

### Ten-word one-liner

Private, verifiable commerce credentials for India's thin-file merchants.

### Project summary

PayProof helps Indian UPI-first merchants prove real commerce without
surrendering their complete bank history. Orders, invoices, settlements and
credits are often genuine but disconnected, forcing lenders into expensive
manual reconstruction or excluding the merchant entirely.

Our live MIT-licensed product processes CSV and JSON evidence locally,
reconciles records into a provenance graph, runs a replayable working-capital
policy, and creates a consent-bound proof passport. The pilot processes 28
records into 13 candidate commerce events, 12 of which are cross-source
triangulated. Raw evidence remains off-chain. A compact PP3 commitment is signed
by the issuer wallet and anchored through Solana Memo; the lender verifier then
recomputes the displayed claims and checks the finalized receipt independently.

PayProof is decision evidence for human review, not a credit bureau score or an
automatic loan approval system.

### Why Solana

PayProof needs low-cost, high-throughput credentials that can be checked by
independent lenders without placing sensitive financial records on-chain.
Solana provides a neutral, portable receipt and issuer-signature rail. The next
milestone replaces the current Memo pilot with a Solana Attestation Service
schema supporting authorized issuers, expiry, revocation and account-bound
credentials. The open schema and reference verifier will be usable by lending,
invoice-finance, rental and B2B marketplace applications.

### Evidence of execution

- Live application and user flow are public.
- Wallet signing and finalized devnet anchoring work.
- The proof URL verifies in a separate browser without wallet access.
- The verifier checks claims, issuer authority, on-chain commitment and expiry.
- CI runs lint, six automated tests, static build, deployment and HTTP asset smoke.
- Source is public under the MIT License.

### Twelve-week milestones and budget

| Milestone | Deliverable | Success measure | Budget |
| --- | --- | --- | ---: |
| 1 | Authenticated case vault and audited import adapters | 4 source types, encrypted cases, audit log | 1,200 USDG |
| 2 | SAS schema, issuer service, expiry and revocation | Public schema and reference verifier on devnet | 1,500 USDG |
| 3 | Ten-merchant evidence-quality pilot | Reconciliation accuracy and exception report | 1,000 USDG |
| 4 | One lender or invoice-finance design pilot | Two review sessions and policy template | 800 USDG |
| 5 | Open specification, security review and findings report | Reproducible SDK docs and public report | 500 USDG |

### Public-good commitment

The Solana credential schema, canonical serialization, reference verifier,
test vectors and non-sensitive reconciliation findings will remain open source.
Commercial work may later include hosted case management and lender workflow
APIs, but no lender will need to trust a private PayProof database to verify an
issued credential.

### What funding unlocks

The grant converts a verified technical pilot into a revocable attestation
protocol and a measured India pilot. Funding is not requested for a token,
lending capital, speculative incentives or a marketing-only launch.

## Required account details

These cannot be committed to the public repository. Prepare them before opening
the forms:

- Founder legal name
- India residence and KYC-ready identity
- Email and Telegram/X contact
- Superteam Earn profile
- Solana payout wallet
- Team member names and roles
- Weekly time commitment
- Any previous bounties, repositories or shipped products

## Submission checklist

- [x] Public product URL
- [x] Public GitHub repository
- [x] MIT license
- [x] Working multi-file evidence import
- [x] Explainable decision receipt
- [x] Consent-bound proof passport
- [x] Downloadable sample evidence bundle
- [x] Grant deck
- [x] 90-second captioned demo
- [x] Finalized Solana devnet transaction linked in README
- [x] Automated CI and live deployment smoke test
- [ ] Founder profile, contact handles and KYC details
- [ ] Two anonymized merchant interview notes
- [ ] One lender or invoice-finance design-partner note

## Deferred routes

### Colosseum Eternal

The official Eternal page currently says the program is paused and is not
accepting new participants. Do not start or claim an Eternal submission until
that status changes.

### Solana Foundation global funding

The global Foundation form is rolling, but PayProof is currently a commercial
product with an open protocol component. Apply later as a convertible/public-good
proposal after producing a lender pilot letter, the SAS reference implementation
and evidence that third parties can reuse the verifier. Avoid sending the same
proposal through both the India and global Foundation routes simultaneously.
