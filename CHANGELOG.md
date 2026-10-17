# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## [1.2.0-rc.3] — 2026-10-15 — review candidate

### Fixed

- Ignore stale crew-role responses after the assignment editor switches
  performances. A late response can no longer replace a newer role choice.
- Block Role and Save while the selected performance's roles are loading
  or unavailable. A failed current request can be retried by reselecting a
  performance; obsolete failures do not replace the current editor state.

### Added

- UIROLE01–02 execute the actual client/editor code with controlled response
  ordering and a real isolated API/SQLite server, covering the selected duty,
  pending/failed loading, Save blocking, recovery and stale failures.
- The suite contains 59 existing API/persistence tests plus two client-state
  regressions. Tests are AI technical evidence; real member review remains
  a separate completion condition. This entry does not imply merge/release.

## [1.2.0-rc.2] — 2026-10-11 — review candidate

This is the local A3 integration candidate, not an approved team release.
See `docs/a3/INTEGRATION_REVIEW.md` for actual publication, PR and final
commit. No tag or merge is implied by this entry.

### Fixed

- Historical assignments keep their currently selected inactive volunteer in
  the editor. Unchanged Save sends no PUT and preserves the full confirmed
  assignment instead of silently choosing the first active alternative.
- Explicit changes still use API validation; changing an inactive
  volunteer's duty remains refused without damaging the original record.

### Added

- Five independent AI technical-review API/persistence regressions: exact
  evening/matinee 9/7 calls, preservation on conflict moves/replacements,
  preservation on unavailable reschedules and reopened extended history.
- Four browser regressions for inactive-history no-op saves, no active
  alternative, explicit active replacement and visible inactive-duty refusal.

### Changed

- Current suite contains 59 API/persistence tests. The prepublication working
  tree passed 59/59; final-commit evidence is recorded separately.
- Current browser checks comprise 12 core flows and four inactive-history
  flows. All are AI-assisted technical checks, not human peer review or UAT.
- Runtime, branching, testing and handover notes distinguish the current
  candidate, A2 history, actual publication state and lecturer/tutor acceptance.

## [1.2.0-rc.1] — 2026-10-11 — historical candidate

### Added

- Input validation, scoped nested performance routes, atomic crew-call edits,
  assignment/reschedule confirmation resets, UI editing controls, local Node
  24 configuration and file-persistence regression coverage.
- Historical evidence for 54 API/persistence tests and 12 browser checks.
  These retained logs describe rc.1 and are not relabelled as rc.2 results.

The previous connector publication attempt failed with HTTP 403. A draft PR
document was local preparation, not a real posted PR or approved release.

## Historical A2 entries

The entries below are retained from A2 source. Their personal repository
versions, self-review and release terminology do not establish current team
A3 PR review, SCRUM history, tags, deployment or acceptance.

## [1.1.1] — 2026-09-24

Handover release: documentation and repository integration only; no
user-facing changes.

### Changed
- README clone instructions now point at the published repository, and the
  branching notes match the delivered workflow (pull request #1; self-review
  recorded on the pull request).
- The team repository scaffold (`README`, `.gitignore`, `.env.example` and
  changelog) is merged into the project line with zero content change, giving
  the line the shared ancestry needed to contribute the delivered work to the
  team's shared repository as a pull request.

## [1.1.0] — 2026-09-24

### Added
- Volunteer unavailability: volunteers can record date ranges they cannot be
  rostered, with an optional reason; assigning (or moving) an assignment onto
  a performance whose date falls inside a recorded range is refused with a
  409 and the reason. API endpoints under `/api/volunteers/:id/unavailability`,
  7 new acceptance tests, and an inline panel in the Volunteers view.

### Changed
- The roster now respects two domain rules instead of one: the
  one-role-per-performance constraint and recorded unavailability.

## [1.0.0] — 2026-09-24

First sprint release: the committed scope for the Tinshed Crew Roster.

### Added
- Volunteer records: create, find, update, deactivate (soft), list with
  `active=all` filter.
- Productions and performances: create/rename/remove productions; add, edit,
  reorder and remove performances; per-performance crew call seeded from
  evening/matinee templates and editable afterwards.
- Assignments: assign a volunteer to a role, replace the volunteer, move an
  assignment, remove it (position reopens), confirm it.
- The company's one-role-per-performance rule, enforced by a database unique
  constraint and surfaced as a 409 refusal with a reason.
- Roster views: performance roster and production roster showing filled/open
  positions; volunteer's own schedule view.
- Single-page front end (plain fetch + DOM, no build step).
- Configuration management: `.env.example`, environment-driven `src/config.js`,
  git-ignored `.env` and `data/`.
- Deployment configuration: `Dockerfile`, `docker-compose.yml`, run-from-clean-
  checkout instructions in the README.
- Automated tests: 27 tests on `node:test`, covering every seed story plus the
  one-role rule (creation and move cases).

### Changed
- `npm test` now uses Node's default test discovery (`node --test`).

### Fixed
- Replacing the volunteer on an assignment now returns the new volunteer's
  name (the updated row was previously fetched without the join).

### Backlog (not committed)
- Candidates for the next sprint (see handover notes): skills/operator lists,
  membership and RSA checks, confirmations and reminders, shift swapping,
  hours reporting for grant acquittal.
