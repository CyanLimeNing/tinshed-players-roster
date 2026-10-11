# Deployment configuration

## Principle

All application settings are read from `config/app.json`, which is checked into the repository as deployment configuration. Environment variables override the file values, so:

- the same code runs in development, test and production without edits;
- secrets and machine-specific values never need to be stored in version control;
- a deployment can be tuned without touching source files.

## Settings

| Setting | config/app.json | Env var | Purpose |
| --- | --- | --- | --- |
| `DB_PATH` | `data/tinshed.db` | `DB_PATH` | SQLite database file location |
| `PORT` | `5000` | `PORT` | TCP port for the web server |
| `HOST` | `127.0.0.1` | `HOST` | Bind address |
| `DEBUG` | `true` | `DEBUG` | Flask debug mode; set `false` in production |
| `ENV` | `development` | `ENV` | Environment name: development / test / production |

Precedence: environment variable > `config/app.json` > safe defaults in code.

## Environments

| Environment | How it runs | Notes |
| --- | --- | --- |
| Development | `python app/app.py` | Dev server on `http://127.0.0.1:5000`, debug on by default |
| Test | `pytest` | Sets `TESTING=True` and points `DB_PATH` at a per-test temporary file, so tests never touch the development database |
| Production | `waitress-serve --host 0.0.0.0 --port 5000 wsgi:app` | Set `DEBUG=false` (and any host/port) via environment variables |

## Database

- SQLite database file: `data/tinshed.db` (configurable via `DB_PATH`), created automatically on first start.
- The `data/` directory is git-ignored: the database is runtime state, not source code.
- The schema is created by the application on startup (`CREATE TABLE IF NOT EXISTS ...`), so no manual migration step is required for this iteration.
