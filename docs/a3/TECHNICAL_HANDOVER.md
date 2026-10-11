# A3 technical handover - candidate for team review

Team repository: CyanLimeNing/tinshed-players-roster.
Prepared 11 October 2026; candidate 1.2.0-rc.2. Baseline: f2999cfdd1d213ce8548ac142c35944decf85d9b.
This is a factual technical contribution prepared with AI assistance. It is not
the team's final assessment report, a signed acceptance form or SCRUM history.

## 1. What was delivered against scope

Local IDs below identify this technical record, not invented Jira issues. The
actual Jira URL, story keys and sprint allocation remain unverified. The table
describes locally working candidate capabilities, not stories declared Done.
The fixed case DoD still requires real team-member review, Jira AC demonstration
and Confluence records. Current publication and final-commit evidence are in
[INTEGRATION_REVIEW.md](INTEGRATION_REVIEW.md).

| ID | Delivered capability | Evidence |
|---|---|---|
| R01 | Create/edit/deactivate volunteers; keep name and contact method | volunteers.test.js; VAL01-04, VAL10; UI04, UI11 |
| R02 | Manage production, dates/times and per-performance crew calls | productions.test.js; VAL05-07, VAL14-17, VAL19-20; REV01, REV04; UI02-03 |
| R03 | Assign/replace/move/remove; refuse a second role in one performance; preserve inactive history on unchanged Save | assignments.test.js; VAL10-13; REV02-03; UI05-07, UI10; IUI01-04 |
| R04 | Performance/production roster and selected volunteer schedule | roster.test.js; UI08-09 |
| R05 | Unavailability bounds and conflict checks on assignment/reschedule | unavailability.test.js; VAL08-09, VAL17; REV03-05 |
| R06 | Preserve data after restart; reproducible setup and configuration | PERSIST01; REV05; actual startup/checkout evidence; README |
| R07 | Usable editing/confirmation controls and readable refusals | UI01-12; IUI01-04; screenshots in delivery evidence |

The baseline already supplied the main entities and API. A3 adds stricter
validation, scoped nested routes, atomic crew-call replacement, confirmation
resets, real interface controls and file-persistence regression coverage. The
database unique constraint enforces the one-role rule. Availability is checked
by API logic; the date-range database CHECK only enforces range ordering.

An independent AI technical review found a P1 interface defect: filtering an
inactive current assignee from the edit selector defaulted to another active
person, so an unchanged Save could silently replace history. The rc.2 editor
retains the inactive current option and sends no PUT for an unchanged Save.
Explicit changes still use API validation. Four browser regressions passed
for unchanged saves with/without an active alternative, explicit replacement
and visible refusal of an inactive duty change. This review supplements, rather
than satisfies, the required real member's PR review.

## 2. What was not delivered, and why

Team-level Jira linkage, PM rotation, sprint meetings, member PR review and
lecturer/tutor formal acceptance need genuine records. Atlassian returned
USER_NOT_LOGGED_IN, so Jira/Confluence updates are pending connection. The
GitHub connector refused branch creation with HTTP 403; current authorised Git
transport and publication results are recorded in INTEGRATION_REVIEW.md.
The connector error is not proof that all Git access is unavailable. Cross-production
assignment moves are supported by API, but the editor offers the current
production's performances only. Authentication, messages, certificates, ticketing,
fees, rehearsals, venues, hours/equipment tracking and swaps remain out of scope.

Skills/qualification matching, membership/RSA/blue-card checks, ticket sales,
membership renewals, rehearsal/casting and venue clashes, hours/grant reporting,
equipment inventory, messages and volunteer swaps require true product-backlog
mapping and reasons for deferral. The local technical record is not that Jira
backlog. No client approval, historical meeting or PM rotation was fabricated.

## 3. Setup and run instructions from GitHub

The root README contains two clearly separated paths: current rc.2 source-ZIP
startup and GitHub checkout after the candidate is actually published. The
verified starting team main is the A2 baseline, not this rc.2 candidate. Use the
real branch/final commit from INTEGRATION_REVIEW.md; do not assume an unpublished
topic branch exists. Install locked dependencies with npm ci, run npm test,
then npm start. Node 24.x is required; checks used 24.19.0 on Windows x64.
No .env is required. Open 127.0.0.1:3000, create a production, add two
performances and add fictional volunteers with contact details. Use Roster to
assign them. Stop and restart using the same DB_PATH to retain records.

For rollback, stop the server and preserve its data directory, switch to the
previous reviewed commit, run npm ci, restore the chosen stopped backup only
if data rollback is needed, then run npm start and verify a known roster. Do
not use a code rollback to erase current records. No schema migration is added.

## 4. Known issues and limitations

- No sign-in or permissions; anyone reaching the application can read/write.
  Use fictional data and the local-only default. No public hosting was performed.
- Required crew counts are staffing targets; overstaffing is possible.
- Adding an unavailable range does not invalidate an existing assignment.
  Resolve conflicts manually before confirming or distributing a roster.
- Deactivation retains existing assignments, including future ones; manually
  reassign future duties when a volunteer leaves.
- Core browser checks cover Edge 155.0.4283.45 at 1365x900 and 390x844;
  inactive-history checks use 1365x900. Safari, Firefox, physical phones and
  full accessibility were not verified.
- Docker configuration is updated but was not run. Load/concurrency/security
  testing and a human backup/restore rehearsal remain outstanding.

## 5. Credentials, configuration and environment

There are no application accounts or passwords. Only synthetic test contacts
are used in screenshots. HOST defaults to 127.0.0.1, PORT to 3000, NODE_ENV to
development, and DB_PATH to data/tinshed.db. The .env file and data are ignored
by Git. See README for stopped-backup instructions. Do not share real contacts.

## 6. Recommended next-sprint backlog

1. Resolve existing-assignment conflicts when new unavailability is recorded:
   this currently requires manual coordinator action and can leave future duties inconsistent.
2. Agree whether crew counts should be hard capacity limits: current targets
   display gaps but permit overstaffing, so the business policy needs confirmation first.
3. Add authentication/authorisation before a shared deployment with real data:
   the current local demonstration has no identity or access control.
4. Rehearse backup/restore: extended automated persistence is verified, but a
   person has not demonstrated recovery from a stopped backup.
5. Execute and retest the Docker path: its configuration exists without
   operational proof, including volume permissions and restart persistence.
6. Add cross-production moves to the editor if needed: the API allows them,
   while the UI currently lists only the selected production's performances.
7. Test keyboard/screen-reader use, other browsers and physical devices:
   current desktop/mobile-sized checks have a limited test environment.
8. Reprioritise out-of-scope stakeholder wishes against value and available
   capacity: keep skills, membership, certificates, messages and reporting
   visible without expanding this candidate's committed scope.

These are local recommendations, not real Jira keys or committed next-sprint
items. Current PR member review, Jira mapping, Confluence publication and
formal acceptance remain current completion gates; they are not deferred by
placing them in a next-sprint list.

## Evidence and acceptance status

The rc.2 prepublication working-tree run passed 59/59 API/persistence tests,
including REV01-05. Current AI browser checks passed 12 core and four
inactive-history flows. These are technical checks, not UAT. The final selected
commit and its rerun are recorded in INTEGRATION_REVIEW.md and retained metadata.
Historical rc.1 54/12 and 5 October logs retain their original dates and versions.

Formal acceptance is awaiting the actual lecturer/tutor process required by
the A3 Brief: 10-minute team presentation followed by 5-minute Q&A. No client
signature, member review, Jira Done state or acceptance is implied by the logs.
The Confluence version of this six-section handover still needs actual publication
and truthful mapping to the team's committed stories.
