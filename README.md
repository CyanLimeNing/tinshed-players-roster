# The Tinshed Players - Crew Roster

ISYS3001 teaching prototype. Candidate **1.2.0-rc.3** adds editable roster
controls and validation to the team A2 baseline, and fixes unchanged Save
silently replacing an inactive volunteer's historical assignment. Use fictional demonstration data: there is
no authentication, and anyone who can reach the server can read/change data.
The rc.3 assignment editor ignores obsolete role responses after switching
performances and blocks saving until the current crew roles are ready.

## Run the current candidate from the supplied source ZIP

Install Node.js 24.x and npm. Tested on Node 24.19.0, Windows x64. No Python,
external database or compilation is needed. The legacy `requirements.txt` is not
used by this Node application.

```bash
# Extract the supplied current source ZIP first, then open its source directory.
cd tinshed-players-roster
npm ci
npm test
npm start
```

Open http://127.0.0.1:3000. Start with an empty database: add a production and
performances, then volunteers, then use Roster to assign them. Stop with Ctrl+C.
Records persist in `data/tinshed.db`. Defaults work without `.env`. The candidate
needs a real team member's PR review. See
[integration review](docs/a3/INTEGRATION_REVIEW.md) for current publication,
branch, PR and final-commit evidence. A connector 403 concerns that operation;
it does not establish that every Git transport is unavailable.

## Run the candidate from GitHub

The team repository is https://github.com/CyanLimeNing/tinshed-players-roster.
The verified starting `main` is the A2 baseline
`f2999cfdd1d213ce8548ac142c35944decf85d9b`; cloning it alone does not retrieve
the current candidate. The topic branch is published in draft PR #5; use:

```bash
git clone https://github.com/CyanLimeNing/tinshed-players-roster.git
cd tinshed-players-roster
git switch codex/roster-validation
npm ci
npm test
npm start
```

After a reviewed merge, use the real merge commit or release tag recorded in
the integration review. PR #5 is awaiting a real team member's review; no merge
or release is implied by the published topic branch.

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

The current suite has 59 behavioural API/persistence tests: 33 inherited,
20 validation, one original file-persistence test and five independent AI
technical-review regressions (REV01-05), plus two client-state regressions
(UIROLE01-02) for role-response ordering, saving, failure and recovery.
The earlier rc.2 prepublication working-tree run
passed 59/59; final-commit evidence is recorded separately in the integration
review and retained run metadata. Older rc.1 logs of 54 tests remain historical.
`helpers.js` is not a test. Evidence records TAP, timestamps, runtime and source
hashes in `docs/a3/evidence/<label>/`; choose a new label for each retained run.

Current browser checks passed 12 core flows plus four inactive-history flows.
These 16 AI-assisted technical checks are separate from the 59 API/persistence
tests. Older rc.1 browser logs of 12 checks remain historical. The technical
delivery bundle retains current browser and prepublication runs in
`outputs/evidence/`; the source ZIP is separate from that evidence bundle.

The repeatable browser runners are included at
`scripts/browser-validation.cjs` and `scripts/inactive-ui-regression.cjs`.
They require an optional Playwright validation environment and installed Edge;
Playwright is not an application runtime dependency or required by `npm test`.
Set `A3_PLAYWRIGHT_MODULE` to the absolute module path of your installed
`node_modules/playwright`, and `A3_UI_EVIDENCE_DIR` to an absolute evidence
directory outside the source checkout. Then run:

```bash
node scripts/browser-validation.cjs
node scripts/inactive-ui-regression.cjs
```

The runners retain their respective core-ui and inactive-ui results and
screenshots under the configured evidence directory. Use fictional fixtures;
record the actual browser, viewport, version and source hashes for each run.

See [handover](docs/a3/TECHNICAL_HANDOVER.md), [test plan](docs/a3/TEST_PLAN.md),
[change/release record](docs/a3/CHANGE_RELEASE.md),
[integration review](docs/a3/INTEGRATION_REVIEW.md) and
[decisions](docs/a3/DECISIONS.md). Automated results do not establish a real
team member's PR review, Jira completion or Confluence publication. Formal
course acceptance is by the lecturer/tutor through the required 10-minute
team presentation and 5-minute Q&A; these logs do not imply that acceptance.

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
A3 changes/documents were prepared with AI assistance and require student
verification and another team member's review. They do not establish historical
sprint activity or human acceptance. MIT; see LICENSE. Case names are fictional.
