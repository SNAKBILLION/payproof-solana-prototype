# PayProof

Income Trust Layer for people without salary slips.

## Product Flow

Open `index.html` in a browser.

MVP flow:

1. Click `Enter Case Room` or `Run Product Flow`.
2. Connect a Solana wallet such as Solflare or Phantom on devnet.
3. Run the AI pipeline across the Evidence Vault.
4. Review the Repayment Readiness Report.
5. Click `Anchor Proof on Devnet`.
6. Show the verifier moment: income threshold verified, raw documents hidden, consent-bound proof hash generated, and Solana devnet transaction linked.

## Solana integration

The current MVP creates a SHA-256 hash of the repayment readiness report and writes it to Solana devnet through the Memo program. The verifier panel displays the credential hash, issuer wallet and explorer transaction link.

## Submission assets

- `SUBMISSION.md`: one-line pitch, problem, solution, demo script and short application answer.
- `APPLY_ROADMAP.md`: Solana/Superteam-focused roadmap, positioning, deck outline and next build steps.

## Locked framing

PayProof is not a lender and does not issue a credit score. It creates an income reliability and repayment readiness credential that helps lenders, landlords or clients manually review informal earners without forcing them to expose raw financial documents.
