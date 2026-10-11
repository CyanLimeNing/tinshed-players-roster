# The Tinshed Players — Crew Roster (Flask edition)

A show scheduling and volunteer crew rostering system for The Tinshed Players Inc., a community theatre company resident at the Wynnum School of Arts Hall, Brisbane. This project is the software artefact for ISYS3001 Assessment 2 (Configuration and Procurement Management).

This branch (`CyanLimeNing`) implements the roster as a small Flask REST API backed by SQLite. See `docs/branching-strategy.md` for how this branch relates to `main`.

## What it does

- **Volunteers** — create, read, update and delete volunteers (name plus a contact method at minimum).
- **Productions** — titled shows that the company puts on.
- **Performances** — each performance belongs to a production and carries a show date and a start time.
- **Assignments** — assign a volunteer to a role for a performance. New assignments start unconfirmed; they can be updated or removed.
- **The company's operating rule** — a volunteer may hold at most one role in any single performance. A second assignment for the same volunteer and performance is refused with HTTP 400, and the rule is enforced both by the application and by a `UNIQUE` constraint in the database itself.

## Prerequisites

- Python 3.11 or newer (uses the standard-library `sqlite3` module; no external database server)
- pip (bundled with Python)

## Setup and run

```
git clone https://github.com/CyanLimeNing/tinshed-players-roster
cd tinshed-players-roster
git checkout CyanLimeNing
python -m venv .venv
.venv\Scripts\activate        # Windows: .venv/Scripts/activate  |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app/app.py             # development server on http://127.0.0.1:5000
```

The SQLite database is created automatically at `data/tinshed.db` on first start (the `data/` directory is git-ignored).

## Run the tests

```
pytest        # or: python -m pytest
```

Each test runs against its own throwaway SQLite database, so the test environment never touches the development data file.

## Configuration

All settings are read from `config/app.json` (checked into the repository as deployment configuration) and can be overridden by environment variables, so secrets and machine-specific values never need to be stored in version control. See `docs/deployment.md` for the full details.

| Setting | config/app.json | Env var | Purpose |
| --- | --- | --- | --- |
| `DB_PATH` | `data/tinshed.db` | `DB_PATH` | SQLite database file location |
| `PORT` | `5000` | `PORT` | TCP port for the web server |
| `HOST` | `127.0.0.1` | `HOST` | Bind address |
| `DEBUG` | `true` | `DEBUG` | Flask debug mode (set `false` in production) |
| `ENV` | `development` | `ENV` | Environment name: development / test / production |

## Production deployment

```
waitress-serve --host 0.0.0.0 --port 5000 wsgi:app
```

`wsgi.py` is a WSGI entry point that imports the app; the same code runs unchanged across environments because all configuration comes from `config/app.json` plus environment variables. See `docs/deployment.md`.

## Project layout

```
app/        Flask application (app.py: config loading, database layer and REST routes)
config/     checked-in deployment configuration (config/app.json)
tests/      pytest acceptance tests (test_api.py)
docs/       branching strategy and deployment notes
wsgi.py     WSGI entry point for production servers
data/       runtime SQLite database (git-ignored, created on first start)
```

## Change log

See `CHANGELOG.md`. Case-study names and details are fictional, created for teaching purposes.
