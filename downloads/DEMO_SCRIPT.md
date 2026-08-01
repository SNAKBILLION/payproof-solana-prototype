# PayProof Demo Script

Final runtime: approximately 86 seconds. The published video includes narration
and burned-in captions.

## 00:00-00:04 - PayProof

PayProof turns fragmented commerce into privacy-preserving decision evidence.

## 00:04-00:17 - The problem

India's small merchants often have real revenue, but no salary slip and no clean
financial file. Their proof is fragmented across orders, invoices, UPI settlements,
and bank credits. Lenders must reconstruct it manually, or reject the case.

## 00:17-00:30 - Evidence graph

PayProof imports those records inside a private browser vault. This pilot normalizes
28 records and reconciles 12 events across independent sources. Every revenue event
keeps its payer, amount, source chain, confidence, and exception reason.

## 00:30-00:43 - Decision lab

The decision lab runs a transparent working-capital policy. It checks observed
history, verified revenue, cross-source triangulation, customer concentration, and
revenue stability. The result is second-look ready for human review, never an
automatic loan approval.

## 00:43-00:53 - Proof passport

The merchant chooses the claims a verifier may see and sets a consent window.
PayProof hashes the evidence into a Merkle root and creates a private credential
commitment. Exact revenue and raw documents remain hidden.

## 00:53-01:07 - Independent verifier

A lender opens a portable verification link in any browser. PayProof recomputes the
displayed claims, checks credential integrity, issuer authority, the on-chain
commitment, issuance time, and consent expiry. No wallet access or PayProof database
trust is required.

## 01:07-01:16 - Finalized receipt

This is the real finalized Solana devnet transaction. The issuer wallet signed it,
the receipt is successful, and the exact transaction can be inspected independently
in Solana Explorer.

## 01:16-01:26 - Public proof

The Memo contains only the commitment, evidence root, credential identifier, and
consent dates. PayProof makes informal commerce portable without publishing a
merchant's financial life. That is the product we are ready to pilot.
