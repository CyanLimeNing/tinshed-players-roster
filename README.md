# The Tinshed Players - Crew Roster

ISYS3001 teaching prototype. Version **1.2.0** is the merged A3 candidate: it adds
editable roster controls and validation to the team's A2 baseline, and fixes the
defect in which an unchanged Save silently replaced an inactive volunteer's
historical assignment. Use fictional demonstration data: there is no
authentication, and anyone who can reach the server can read and change data.

## A3 submission - graded artefact

- **Course:** ISYS3001 Assessment 3, Group 26 (Shiyuan Qu, Yujie Li, Shuhang Zhang).
- **Graded source:** `main` at `2db8541` (version 1.2.0; the A3 candidate was
  merged from pull request #5 at `450d171`).
- **Member review:** Yujie Li reviewed commit `f3397cc` on 15 October 2026 and
  re-ran five end-to-end scenarios (assignment and confirmation; second-role
  refusal with the original data unchanged; inactive volunteer unchanged Save;
  performance switch with the correct role; personal schedule) - all passed.
  Evidence: [docs/a3/reviews/](docs/a3/reviews/).
- **Automated tests:** `npm test` - 61 tests, 61 pass, 0 fail (Node.js 24).
- **Demonstration package:** `25258981_ISYS3001_A3_26_Windows_Demo_RC3.zip`
  (portable Node 24 runtime, fictional fixtures, launcher and reset tool; kept
  outside this repository).
- **Technical record set:** test plan, integration review, decision record,
  change and release record, handover and the rc.3 review follow-up under
  [docs/a3/](docs/a3/).

## Run from a clean checkout

Install Node.js 24.x and npm. No Python, external database or compilation is
needed. The legacy `requirements.txt` is not used by this Node application.

```bash
git clone https://github.com/CyanLimeNing/tinshed-players-roster.git
cd tinshed-players-roster
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

Browser checks: 12 core interface flows and 4 inactive-history flows passed on
the rc.2 working tree; they are separate from the 61 automated tests and have
not been re-run against the final commit. Yujie Li's member review re-executed
five end-to-end scenarios against the final commit `f3397cc`; the screenshots
are in `docs/a3/reviews/yujie/`. Older rc.1 browser logs of 12 checks remain
historical. The runners are `scripts/browser-validation.cjs` and
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

`.github/workflows/test.yml` runs `npm ci` and `npm test` on every push and pull
request, so a failing test suite blocks a merge into `main`.

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
