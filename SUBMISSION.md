# PayProof Submission Pack

## Product

PayProof is an Income Trust Layer for small UPI merchants, freelancers and informal earners who do not have salary slips.

## One-line pitch

PayProof helps people without salary slips prove repayment capacity using AI-verified income evidence, privacy-safe verifier links and on-chain consent-bound credentials.

## Problem

Millions of informal earners have real cashflow but no trusted way to prove it. Their income is fragmented across UPI screenshots, bank SMS, invoices, gig payouts, WhatsApp orders and cash notes. When they apply for credit, rent or work verification, they either overshare full financial statements or get rejected as thin-file borrowers.

## Solution

- AI extracts amount, date, payer and source type.
- AI flags duplicate, inconsistent or suspicious proofs.
- The worker receives an Income Reliability Score and Repayment Readiness Signal.
- Raw documents stay private.
- A credential hash, timestamp and consent receipt are anchored on-chain.
- A lender, landlord or client verifies the summary through a shareable link.

## Hackathon demo wedge

The demo is not a generic dashboard. It is a live case room:

1. Ravi is a small UPI merchant applying for working capital review.
2. Judges see the Evidence Vault with UPI, invoice, SMS and excluded cash evidence.
3. The AI Pipeline runs through parsing, fraud detection, cashflow modeling and private credential creation.
4. The Repayment Readiness Report unlocks a conservative income range.
5. The report hash is anchored on Solana devnet through the Memo program.
6. The verifier page proves an income threshold while hiding raw documents.
7. The verifier receives a credential hash, issuer wallet and Solana explorer link.

## What PayProof is not

PayProof is not a lender, credit bureau or loan approval engine. It is a verification layer that helps lenders and reviewers make better manual decisions while protecting user privacy.

## Winning demo flow

1. Ravi, a small UPI merchant, uploads UPI screenshots, a freelance invoice and bank SMS.
2. PayProof extracts income evidence and identifies reliability signals.
3. The app generates a verified monthly income range of Rs 42k-48k.
4. It creates an 82/100 Income Reliability Score and 91% proof confidence.
5. Ravi shares a verifier link.
6. The verifier sees repayment readiness without seeing Ravi's raw documents.

## Why crypto is necessary

- On-chain credential hash.
- Consent receipt for who accessed what, and when.
- Portable wallet/DID-linked financial reputation.
- Future repayment credentials that can move across platforms.

## Solana technical proof

The current prototype is Solana-focused. It hashes the structured repayment readiness report with SHA-256, asks the connected wallet to sign a devnet transaction, and writes the proof memo to Solana's Memo program. The verifier screen shows the report hash, issuer wallet and Solana explorer link.

## Why this can win

- Real user pain: informal earners have cashflow but no trusted proof.
- Clear demo moment: prove "above Rs 35k/month" without exposing bank history.
- Useful AI: extraction, fraud flags and conservative cashflow modeling.
- Useful crypto: portable, tamper-resistant and consent-bound credential.
- Controlled regulatory risk: PayProof does not approve or issue loans.
- Easy sponsor adaptation: Solana, Celo, Base, World, attestations or ZK threshold proof.

## Recommended first applications

1. Superteam Instagrants / Superteam Earn
2. Solana Foundation India Grant
3. Celo Builder Fund
4. Interledger Local Impact Mini-Grants
5. Stellar Community Fund
6. ETHOnline 2026
7. ETHGlobal Mumbai 2026

## Short application answer

PayProof creates privacy-safe repayment proof for people without salary slips. Our MVP helps a small UPI merchant upload scattered income evidence, uses AI to extract cashflow and fraud signals, and generates a verifier link where lenders can confirm income reliability without seeing raw financial documents. We use on-chain credentials to make the proof tamper-resistant, portable and consent-aware.

## 60-second demo script

Ravi runs a small food stall and receives most payments through UPI, invoices and platform settlements. He earns consistently, but when he asks for small working capital credit, he has no salary slip and does not want to expose his full bank statement. In PayProof, Ravi uploads sample income evidence. The system extracts income, checks consistency and flags suspicious proofs. It generates a monthly income range, reliability score and repayment readiness signal. Ravi then creates a privacy-safe credential. The verifier sees that Ravi's income threshold is verified, the proof is valid on-chain and the raw documents remain hidden. PayProof does not approve loans; it gives informal earners trusted proof to access manual credit review.
