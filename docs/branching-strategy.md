# Branching and review strategy

This file separates inherited A2 notes from the A3 integration proposal. The
formal A3 Brief requires a three-member team. Earlier wording about a
four-person team and a mandatory long-lived `develop` line is not evidence of
the current team's membership or actual branch workflow.

## A2 history

The inherited documentation described GitHub Flow with `feature/*` branches
merging into `develop`, then `develop` into `main`. The changelog's 1.0.x/1.1.x
entries are historical A2 records; they do not establish new A3 releases or
prove that a `develop` branch is currently used in the team repository.

The A3 candidate starts from team `main`
`f2999cfdd1d213ce8548ac142c35944decf85d9b`. The 29 tracked baseline blobs were
verified when materialising the local source snapshot. Its tree matches
`b29f71cb5d70968f5972ba26c0891f944b381c45`. A materialised snapshot is not a
successful network clone or a new remote baseline commit.

## Proposed A3 workflow

Use a short-lived story/topic branch from verified team `main`, then a real
PR back to `main`. This fits a small integration change and preserves the case
study's requirement for another team member to review before merge. This is a
proposal and local workflow until the corresponding remote objects exist.

| Branch or object | Intended use | Actual evidence needed |
|---|---|---|
| `main` | Team baseline and reviewed integration destination | Real remote SHA; reviewed merge before calling rc.2 a release |
| `codex/roster-validation` | Current local candidate branch for validation and roster editing | Successful remote push, PR URL and final head |
| A genuine Jira/story branch for later work | One coherent story or task per branch | Real story key/topic, commits, review and tests |
| Release tag | Identify an approved release commit | Actual tag after the team agrees and completes release gates |

Branches name the story or capability and use lowercase hyphenated slugs.
Do not include student identifiers. A real Jira key can be included once it is
known; local IDs such as R03 or CR09 are not invented Jira keys.

## Merge procedure

1. Confirm the actual team `main` and prepare the story/topic branch from that
   baseline. Inspect the diff before bringing in the candidate package.
2. Commit implementation, necessary regressions and accurate technical
   documentation. Record the actual final head.
3. Push with an authorised contributor account and create a real PR to `main`.
   Check `docs/a3/INTEGRATION_REVIEW.md` for current transport and publication
   results. A connector 403 is specific to that connector operation; it does
   not by itself prove all Git transports are unavailable.
4. Have another real team member review against the real Jira AC. Record review
   comments and their disposition before merge. Independent AI technical
   review is additional evidence and cannot satisfy the member-review condition.
5. Run the 59-test suite on the final selected commit, exercise the affected UI
   paths and record README-only clean-checkout startup. Maintain truthful Jira
   state and publish decisions and the six-section handover in Confluence.
6. Merge only after the fixed case DoD is satisfied. Use the team's actual merge
   method, record the resulting SHA and repeat checks affected by integration.
   Tag only the reviewed release that the team actually approved.

No branch protection, required approvals, CI enforcement, merge method or
remote tag is claimed to exist merely because it appears in this procedure.
Verify the repository's real capabilities and settings.

## Commit conventions

Use conventional, imperative messages where practical:

- `feat:` introduces a capability.
- `fix:` corrects behaviour.
- `test:` adds meaningful verification.
- `docs:` updates instructions or evidence.
- `chore:` changes tooling/configuration.
- `refactor:` restructures without changing behaviour.

Keep final-commit logs, PR review, Jira AC and the changelog consistent. Candidate
version `1.2.0-rc.2` is not a claim that a team release tag or merge exists.
