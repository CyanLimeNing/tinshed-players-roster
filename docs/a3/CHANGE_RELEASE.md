# A3 change and release record

> Current follow-up candidate: rc.3 (15 October 2026). See [RC3_REVIEW_AND_VALIDATION.md](RC3_REVIEW_AND_VALIDATION.md) for the role-response correction and new tests. The rc.2 execution records below retain their original dates and source identity.

Recorded 11 October 2026. Version 1.2.0-rc.2 is a review candidate, not an approved
release. Starting team main: f2999cfdd1d213ce8548ac142c35944decf85d9b. The personal
A2 repository's v1.1.x tags are separate references and are not team release tags.

| Local change | Problem and treatment | Regression evidence |
|---|---|---|
| CR01 | Blank contact/name updates and impossible dates/times accepted; validate before writing | VAL01-09 |
| CR02 | Assignment changes bypassed active/crew-role checks or kept stale confirmation | VAL10-13 |
| CR03 | Nested routes could address a performance under the wrong production | VAL14 |
| CR04 | Duplicate crew-role edits could erase calls; validate and use transaction; protect assigned roles | VAL15-16 |
| CR05 | Rescheduling could conflict with unavailable dates and retain confirmation | VAL17, VAL19 |
| CR06 | Malformed JSON returned server error; return client error; reject unknown templates | VAL18, VAL20 |
| CR07 | Page lacked update/confirm/remove flows; error banner was overwritten | UI01-12 |
| CR08 | Setup/runtime evidence incomplete; require Node 24, local host default, persistence test and release instructions | PERSIST01; clean-start evidence |
| CR09 | Inactive current assignee disappeared from editor options, so unchanged Save could silently select another active person; retain current inactive option and skip PUT for no-op Save | IUI01-04; see INTEGRATION_REVIEW.md |
| CR10 | Existing tests did not prove exact 9/7 calls or full state preservation across all refusals and reopened extended history; add independent AI technical regressions | REV01-05; 59-test suite |

These are local technical change IDs, not approval records or Jira issue keys.
No database columns, new runtime packages or paid services are introduced.
Express and dotenv remain locked by package-lock.json. No purchase was made.
There is no evidence of actual hosting expenditure or a new supplier contract;
any A2 budget forecast must remain labelled as a forecast in the team report.

## Review and release procedure

Current publication, real branch/PR, selected commit and transport result are
recorded in [INTEGRATION_REVIEW.md](INTEGRATION_REVIEW.md). The GitHub connector
returned HTTP 403, Resource not accessible by integration, when creating the
candidate branch. That error concerns the connector; an authorised Git path is
checked separately and is not declared unavailable by this document.

The starting local snapshot verified 29 tracked blobs and exactly matched
baseline tree `b29f71cb5d70968f5972ba26c0891f944b381c45`. Its locally created
snapshot commit is a materialisation record, not a remote ancestor to merge.
Publication must use the actual fetched team Git history and real authorisation.

1. Review candidate diff and evidence through the real PR once it exists. A different team
   member must review; record their actual comments and disposition.
2. Resolve comments, link genuine Jira acceptance criteria, and repeat affected
   tests on the final commit. Capture an independent README-only setup check.
3. Record real AC demonstrations and formal course acceptance by lecturer/tutor:
   the A3 Brief specifies a 10-minute team presentation and 5-minute Q&A.
   AI technical checks do not constitute member review or UAT.
4. After review, the team maintainer may merge and tag the agreed release commit.
   This document does not establish a tag, merge or public deployment.
5. Keep a stopped database backup and prior reviewed commit for rollback.

The course page asks for a private team repository and tutor access. Any previous
public-visibility observation is historical; verify the current repository
setting, owner permissions and tutor access before final submission. No
security/privacy change is implied by the technical candidate.

## Definition of Done status

The rc.2 prepublication working tree passed 59 API/persistence tests and the
documented 12 core plus four inactive-history browser flows passed. Final-commit
results remain distinct from this working-tree run and are recorded in the
integration review. Older rc.1 54/12 records are retained as history.

Another real member's PR review, true Jira state, AC demonstration, Confluence
decisions/handover, README-only clean checkout and lecturer/tutor formal
acceptance require their own real evidence. Atlassian currently reports
USER_NOT_LOGGED_IN. Do not mark a story Done solely because tests passed, and
do not label an AI technical review as the required member review.
