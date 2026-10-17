# AI Engineering Factory Runtime

This runtime turns validated factory work into a reviewable GitHub draft pull request while preserving human control over final approval and merge.

## Runtime flow

Task
→ adaptive factory
→ implementation
→ validation
→ review
→ evidence
→ draft pull request
→ human approval

## Safety model

The runtime defaults to `dry-run`.

In dry-run mode:

- no real GitHub request is made
- a deterministic fake GitHub client is used
- the same lifecycle and PR-generation logic is exercised

In live mode:

- a GitHub token is required
- the GitHub API client creates only draft pull requests
- validation must already have passed
- the factory result must be at `FINAL_APPROVAL_REQUIRED`
- the task must be at `AWAITING_FINAL_APPROVAL`
- final merge remains human-controlled

The factory does not expose a merge operation.

## Delivery command

From the `factory` directory:

```bash
npm run factory:deliver -- \
  src/runtime/fixtures/trackhire-final-result.json \
  factory/TH-001 \
  "feat: add TrackHire interview dates"