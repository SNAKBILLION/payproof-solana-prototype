# PayProof Submission

## One-line pitch

PayProof reconciles fragmented merchant commerce into privacy-safe, lender-verifiable
revenue evidence.

## The wedge

Thin-file UPI and WhatsApp merchants are not invisible because they lack commerce.
They are invisible because their orders, invoices and settlements cannot be joined
into evidence a lender can review.

PayProof builds a provenance graph across independent sources, runs an explainable
second-look policy, then lets the merchant share only the claims needed for a
working-capital review.

## What is technically working

- Browser-local CSV and JSON evidence import.
- Deterministic cross-source reconciliation with time, amount, payer and reference matching.
- Verified, supported and unmatched event classification.
- Monthly revenue, volatility, payer concentration, history and data-quality metrics.
- Replayable policy receipt with stable reason codes.
- Merchant-controlled disclosure and 1, 7 or 30 day consent expiry.
- SHA-256 evidence leaves, Merkle root and private credential commitment.
- Privacy-safe lender view with no raw-record access.
- Phantom and Solflare detection.
- Real Solana devnet Memo transaction path.

## Why Solana

The chain is not used for raw data or a token. It provides a neutral timestamped
commitment that a verifier can independently check. The next protocol step is a
Solana Attestation Service credential with revocation and repayment-outcome
attestations.

## Two-minute demo

1. Load the Asha Home Foods pilot case.
2. Show 28 source records becoming 13 commerce events.
3. Open one event and explain its order/invoice/payment provenance.
4. Run the policy and show every reason behind the 5/5 second-look result.
5. Choose the revenue and stability claims and generate the private commitment.
6. Switch to lender view and show that raw records are unavailable by design.
7. Connect Solflare or Phantom and anchor the commitment on Solana devnet.

## What PayProof is not

PayProof does not approve a loan, create a universal credit score, pool capital or
publish merchant transactions. It is evidence infrastructure for human review.

## Grant ask

Fund a 12-week pilot with 25 merchants and two lending or invoice-finance partners.
Milestones: authenticated case vault, issuer service, SAS attestation and revocation,
lender policy templates, and measured reduction in manual verification time.


