# The Tinshed Players - Crew Roster

ISYS3001 teaching prototype. Version **1.2.0** is the merged A3 candidate: it adds
editable roster controls and validation to the team's A2 baseline, and fixes the
defect in which an unchanged Save silently replaced an inactive volunteer's
historical assignment. Use fictional demonstration data: there is no
authentication, and anyone who can reach the server can read and change data.

## A3 submission - graded artefact

- **Course:** ISYS3001 Assessment 3, Group 26 (Shiyuan Qu, Yujie Li, Shuhang Zhang).
- **Graded source:** version **1.2.0**, frozen at
  `b4a300b7b69d2127a7552f22434c3907c2228be9` from `main`. The A3 candidate was
  merged from pull request #5 at `450d171`. Documentation maintenance is reviewed
  separately; the assessed application and final packages remain pinned to the
  frozen commit.
- **Delivery student:** Shiyuan Qu, **25259191**, according to the latest direct
  confirmation. Other members' student IDs require their own confirmation.
- **Member review:** Yujie Li reviewed commit `f3397cc` on 15 October 2026 and
  re-ran five end-to-end scenarios (assignment and confirmation; second-role
  refusal with the original data unchanged; inactive volunteer unchanged Save;
  performance switch with the correct role; personal schedule) - all passed.
  Evidence: [docs/a3/reviews/](docs/a3/reviews/).
- **Automated tests:** the 18 October 2026 Windows fresh-checkout run passed
  `npm ci` and all 61 tests at the frozen commit (Node 24.19.0, npm 11.19.1).
  The [public CI job at the same commit](https://github.com/CyanLimeNing/tinshed-players-roster/actions/runs/39050361590/job/117447525615)
  separately passed 61/61 on Ubuntu with Node 24.21.0.
- **Final source package:** `25259191_ISYS3001_A3_26_Source_FINAL.zip` - 65
  tracked files, byte-identical to the verified Windows checkout; Git content
  matches with CRLF/LF conversion only. No dependencies, database or real `.env`
  are included.
- **Final demonstration package:** `25259191_ISYS3001_A3_26_Windows_Demo_FINAL.zip`
  contains the same frozen application, Windows x64 Node 24.19.0, locked dependencies,
  newly generated fictional fixtures, launcher and safe reset tool. The final
  packages and their verification records are delivered outside this repository.
  The [Confluence handover](https://scu-it.atlassian.net/wiki/spaces/MSD426GXUST26/pages/1116275297)
  is the shared evidence entry point.
- **Technical record set:** test plan, integration review, decision record,
  change and release record, handover and the rc.3 review follow-up under
  [docs/a3/](docs/a3/).

## Run from a clean checkout

Install Node.js 24.x and npm. No Python, external database or compilation is
needed. The legacy `requirements.txt` is not used by this Node application.

```bash
git clone https://github.com/CyanLimeNing/tinshed-players-roster.git
cd tinshed-players-roster
git checkout --detach b4a300b7b69d2127a7552f22434c3907c2228be9
npm ci
npm test
npm start
```

Open http://127.0.0.1:3000. Start with an empty database: add a production and
performances, then volunteers, then use Roster to assign them. Stop with Ctrl+C.
Records persist in `data/tinshed.db`. Defaults work without `.env`.

## Interface

- Volunteers: create, edit contact details, deactivate, view inactive records.
- Productions: create/rename/remove; add/edit/remove individual performances.
- Crew call: edit role names and required counts for each performance.
- Assignments: assign, confirm, replace, change role, move to another performance
  in the same production, and remove. The API also supports moves across productions.
- Historical assignment editing retains the currently selected inactive
  volunteer. Unchanged Save sends no PUT and preserves the full assignment.
  Explicit changes still pass through the API's active-person, role, one-role
  and availability checks.
- Roster: see openings per performance or all performances in an overview.
- Schedule: filter by a volunteer, including inactive volunteers. This is not a
  private account. Confirmation records an external reply; no message is sent.
- Availability: record/remove unavailable date ranges. Assignment creation and
  changes, plus performance rescheduling, check dates in the API.
- One role per volunteer per performance is also enforced by a database unique
  constraint. Actual assignment changes and rescheduling reset confirmation;
  unchanged assignment updates preserve it.

Delete confirmations explain cascades. Removing a production removes its
performances and assignments. Removing one assignment reopens that role.

## Configuration and data

Defaults work without `.env`. Optionally copy `.env.example` to `.env` using
`Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in a POSIX shell.
Do not commit `.env`, databases, backups or real contact details.

| Variable | Default | Purpose |
|---|---|---|
| NODE_ENV | development | Environment label |
| HOST | 127.0.0.1 | Local-only demonstration |
| PORT | 3000 | Server port |
| DB_PATH | ./data/tinshed.db | Persistent SQLite file; `:memory:` is disposable |

Back up by stopping the server, copying the complete `data` directory to a dated
backup, then restarting. Restore only while stopped; retain current data before
replacing it. This candidate changes no database columns.

## Verification and handover

```bash
npm test
npm run test:evidence -- local-review
```

The suite contains 61 behavioural API, validation, persistence and client-state
tests: 33 inherited, 20 validation, one original file-persistence test, five
review regressions (REV01-05) and two client-state regressions (UIROLE01-02)
for role-response ordering, saving, failure and recovery. `npm test` runs
`node --test test/*.test.js`; `helpers.js` is not a test. Evidence records TAP,
timestamps, runtime and source hashes in `docs/a3/evidence/<label>/`; choose a
new label for each retained run.

The 18 October 2026 AI Windows verification at the frozen 1.2.0 commit passed
12 core interface checks and 4 inactive-history checks in Edge 155.0.4283.45,
using 1365x900 and 390x844 core viewports and a desktop inactive-history viewport.
These rendered checks are separate from the 61 automated tests. The same run
passed 65 startup/restart assertions and 8 supplemental API scenarios with
175 assertions. A fresh extraction of the final Windows package passed 8 UI
checks and 5 lifecycle checks, including persistence, reset backup and baseline
restoration. These are AI technical records, not real-member or course acceptance.

Earlier rc.1/rc.2 browser records and the 15 October rc.3/f3397cc evidence retain
their original dates and versions. Yujie Li's member review executed five
scenarios at `f3397cc`; its screenshots remain in `docs/a3/reviews/yujie/`.
The repeatable runners are `scripts/browser-validation.cjs` and
`scripts/inactive-ui-regression.cjs`; they need an optional Playwright
validation environment and installed Edge, and Playwright is not an application
runtime dependency or required by `npm test`. Set `A3_PLAYWRIGHT_MODULE` to the
absolute module path of your installed `node_modules/playwright`, and
`A3_UI_EVIDENCE_DIR` to an absolute evidence directory outside the source
checkout. The runners retain their respective core-ui and inactive-ui results
and screenshots under the configured evidence directory. Use fictional
fixtures; record the actual browser, viewport, version and source hashes for
each run.

See [handover](docs/a3/TECHNICAL_HANDOVER.md), [test plan](docs/a3/TEST_PLAN.md),
[change/release record](docs/a3/CHANGE_RELEASE.md),
[integration review](docs/a3/INTEGRATION_REVIEW.md) and
[decisions](docs/a3/DECISIONS.md). Automated results do not establish real
user-acceptance testing or formal acceptance. Formal course acceptance is by
the lecturer/tutor through the required 10-minute team presentation and
5-minute Q&A; these logs do not imply that acceptance.

## Continuous integration

`.github/workflows/test.yml` automatically runs `npm ci` and `npm test` on pushes
and pull requests. Inspect the run for the commit under review. Required merge
checks depend on the repository's branch-protection or ruleset configuration.

## Optional Docker configuration - not execution-tested in this A3 run

Run `docker compose up --build`. Compose exposes only 127.0.0.1:3000 and retains
the `roster-data` volume. Inside the container the app listens on 0.0.0.0. The
Node 24 Dockerfile creates the data directory for non-root user `node`. Verify
container operation separately. Do not use `down -v` on data you need.

## Limitations and attribution

No sign-in, permissions, email/SMS, skills/certification checks, ticketing, fees,
rehearsals, venues or swaps. Crew counts are targets, not enforced maximums.
Adding unavailability does not cancel existing assignments; the coordinator
must resolve those conflicts. No load or production security assessment was run.
Deactivation preserves existing assignments, including future duties that may
need manual replacement. UI checks used Edge 155.0.4283.45 at desktop and
mobile-sized viewports; the inactive-history checks used a desktop viewport.
Physical phones, Firefox/Safari, full accessibility, load/concurrency,
production security, Docker execution and human backup/restore were not verified.

`src/` server, `public/` interface, `test/` tests, `docs/` technical evidence.
A3 changes and documents were prepared with AI assistance and were verified by
the team where stated; they do not establish historical sprint activity or
human acceptance. MIT; see LICENSE. Case names are fictional.
