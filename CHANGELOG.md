# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [1.0.0] - 2026-10-11

This week's iteration — persistence, configuration management and deployment readiness.

### Added
- SQLite persistence for all resources (volunteers, productions, performances, assignments); the roster now survives server restarts (`data/tinshed.db`, git-ignored).
- `config/app.json` as checked-in deployment configuration, overridable by environment variables.
- `wsgi.py` WSGI entry point and `waitress` as the production server dependency.
- `.gitignore` covering Python build artifacts, test cache and runtime data.
- Project documentation: `README.md`, this changelog, and configuration management notes under `docs/`.

### Changed
- Tests are now isolated: each pytest case runs against its own throwaway SQLite database, so the test environment never touches the development data file.
- All endpoints hardened with input validation, referential integrity checks and JSON-safe row serialisation.

## [0.2.0] - 2026-09-30

### Added
- Production, performance and assignment REST endpoints.
- Core business rule: a volunteer may hold at most one role per performance, refused with HTTP 400, plus a pytest case covering the rule.

## [0.1.0] - 2026-09-30

### Added
- Flask REST API for volunteer CRUD with pytest unit tests.
- Project scaffolding: `app`, `config` and `tests` packages.
