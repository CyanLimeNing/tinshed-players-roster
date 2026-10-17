# Runtime and deployment notes

The rc.2 delivery runs locally with Node 24 and persistent SQLite. The case study
permits code plus clean-checkout instructions; no public deployment is required
by the case. Public hosting, Docker execution and production operation are not
established by these configuration files.

## Current local startup

Follow the root README from the supplied rc.2 source ZIP. After a real story
branch or reviewed release is published, use the README's GitHub checkout path
and the exact reference recorded in `docs/a3/INTEGRATION_REVIEW.md`.

```bash
npm ci
npm test
npm start
```

The lockfile controls installation. No `.env` is required: HOST is 127.0.0.1,
PORT is 3000 and DB_PATH is `./data/tinshed.db`. Use an illustrative `.env` only
when overriding these defaults. The rc.1 source-copy clean-start log is
historical; it does not prove a team member cloned and ran rc.2.

## Environments

| Aspect | Local demonstration | Automated test | Optional Docker configuration |
|---|---|---|---|
| NODE_ENV | development by default | test | production label |
| Database | `./data/tinshed.db` | Isolated `:memory:` or temporary file for persistence tests | Named volume at `/app/data/tinshed.db` |
| Configuration | Defaults; optional ignored `.env` | Explicit test fixtures and defaults | Environment in `docker-compose.yml` |
| Server | `npm start` | In-process app factory | `node src/server.js` |
| Evidence | Actual startup/restart log for the selected commit | TAP, metadata and source hashes | Not execution-tested in this A3 run |

`NODE_ENV=production` is an environment label. It does not add authentication,
authorisation, encryption, production security controls or a hosting service.

## How the pieces fit

1. **`.env.example`** documents every supported variable with safe defaults;
   the real `.env` is git-ignored so secrets never reach the repository.
2. **`src/config.js`** is the single place configuration is read. Routes never
   read `process.env` directly, which keeps environment concerns in one file.
3. The Node 24 **`Dockerfile`** uses an install stage and runtime stage, runs as
   non-root user `node`, and prepares its data directory for that user. Compose
   keeps the SQLite file on a named volume.
4. **`docker-compose.yml`** wires the image, port mapping, environment and the
   data volume together for one-command deployment (`docker compose up`).

## Optional Docker commands — not execution-tested

These commands are instructions for a separate validation task, not a record
of successful commands in this A3 run. Compose exposes 127.0.0.1:3000; inside
the container the application listens on 0.0.0.0.

```bash
docker compose up --build -d
docker compose logs -f app
docker compose down
```

Verify build, startup, write permissions and restart persistence before
claiming this path works. Do not use `docker compose down -v` on data you need.
Back up while the application is stopped; retain current data before restoring
a selected stopped backup. No schema migration is introduced.

## Hosting and release limits

The earlier A2 procurement forecast does not demonstrate a deployed or
purchased service. A local SQLite file requires durable storage if hosting is
later adopted. Record the real storage, budget and restart behaviour in a new
decision; do not carry a zero-cost persistence claim into A3 without evidence.

No GitHub Actions workflow or successful CI run is established by these notes.
Local tests, a real member's PR review and a final-commit rerun are separate
release gates. See the integration review for current publication state and
the change/release record for the remaining course DoD requirements.
