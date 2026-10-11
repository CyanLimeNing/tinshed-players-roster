# A3 candidate integration and technical review

Prepared 11 October 2026, candidate 1.2.0-rc.2. This is a factual software record
prepared with AI assistance, separate from the student's formal assessment report.

## Baseline and import

- Confirmed target: https://github.com/CyanLimeNing/tinshed-players-roster
- Remote main: `f2999cfdd1d213ce8548ac142c35944decf85d9b`.
- Actual remote tree: `b29f71cb5d70968f5972ba26c0891f944b381c45`.
- The candidate patch was checked/applied against all 29 verified baseline files.
  A temporary local snapshot had exactly the same tree as remote main. This
  snapshot is verification history, not an independently cloned team commit.
- Git's initial direct connection failed; the GitHub connector's branch-create
  operation returned HTTP 403 `Resource not accessible by integration`.
- Using the computer's already configured system proxy restored Git transport;
  actual remote main and history have now been fetched. The candidate branch
  was moved onto actual remote main (identical baseline tree) before committing
  changes; the synthetic snapshot is not part of the candidate's ancestry.
  No global proxy setting or repository security setting was changed.

Publication status: pending final publication attempt. The topic is
`codex/roster-validation`, targeting team main. Actual PR/commit links will be
recorded only if the remote operation succeeds.

## Independent AI technical review and disposition

| Finding | Reproduction and impact | Treatment | Verification |
|---|---|---|---|
| P1 inactive-history editor silently replaced original person | Confirm an assignment, deactivate its volunteer, create an active alternative, open Change and press Save without editing. The old editor excluded the current person and sent the first active ID; history changed and confirmation reset | Include the current inactive option only in the existing-assignment editor. No-change Save sends no PUT; real changes still use API validation | IUI01-04: active alternative, no active volunteers, explicit replacement, inactive role-change refusal; 4/4 passed |
| Missing full template assertions | Existing PROD06 checked Bar/Usher but not complete calls or total positions | REV01 checks exact evening/matinee roles and totals 9/7 | Passed |
| Refusal checks lacked complete state comparison | A status code alone could miss partial mutation | REV02-04 compare confirmed assignments and complete affected/unaffected performance records | Passed |
| File persistence assertions were narrow | Original PERSIST01 did not compare inactive history, availability and revised crew | REV05 closes/reopens the file and compares persisted records and subsequent availability refusal | Passed |

Full automated suite in this working tree: 59/59 passed. Core Edge workflow:
12/12 passed, desktop 1365x900 and mobile viewport 390x844. Additional history
workflow: 4/4 passed, desktop 1365x900. These are AI-assisted technical checks,
not 75 independent requirements or human UAT. Source/version/commit evidence
for the final selected commit is recorded in the delivered evidence directory.

The review found one reproducible P1 issue and verified its correction. Within
these checks no remaining critical defect was identified. Known limits in the
handover remain; this conclusion is bounded by the recorded test scope.

## Fixed case Definition of Done: current evidence gates

| Gate | Evidence / remaining requirement |
|---|---|
| Code committed and pushed on a story branch | Local imported candidate and tests exist; remote publication outcome must be verified |
| Every Jira AC met and demonstrated | R01-R07 technical traceability exists; real keys, approved AC and demonstration pending account connection |
| Another team member's PR review resolved before merge | Independent AI technical review above is complete; real human teammate PR review is still pending |
| Covering automated tests pass, including one-role rule where applicable | 59-test suite includes one-role creation/move/replacement checks and refusal-state comparisons |
| README-only clean checkout runs | Automated independent clean-source/process-start check to be recorded; a real member must reproduce the actual published checkout |
| No known critical defects | Reproduced historical-assignment defect fixed; tested core paths pass; known limits disclosed |
| Jira reflects reality; decisions/assumptions in Confluence | Account currently unconnected; local mapping and DECISIONS are prepared but unpublished |

Do not mark the stories Done until all seven original gates are satisfied.
No merge, release tag, teacher acceptance, teammate signature or historical
meeting/PM rotation is implied by this technical record.
