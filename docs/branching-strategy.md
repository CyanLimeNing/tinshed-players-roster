# Branching strategy and configuration management

## Branches and their roles

| Branch | Role |
| --- | --- |
| `main` | Stable trunk. The earlier implementation of the roster system was integrated here through reviewed pull requests. `main` is only updated via pull requests so it stays buildable. |
| `CyanLimeNing` | Active development branch for the Flask/SQLite implementation of the roster system. Weekly iterations are committed directly on this branch (Conventional Commits) and pushed to the remote. |
| `feature/<topic>` | Short-lived topic branches for isolated work items. They are integrated through pull requests and deleted once merged. |

## Working model

1. Development happens on `CyanLimeNing`. Each iteration is delivered as a small set of Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`) so the history reads as a clean, reviewable sequence of changes.
2. Larger or experimental changes are prepared on `feature/<topic>` branches and merged via pull request, keeping `main` free of work-in-progress.
3. After an iteration is verified locally (tests pass, server boots), it is pushed to `origin/CyanLimeNing` and, when ready, proposed for integration into `main` through a pull request.

## Commit message convention

Conventional Commits are used for every commit on this branch, for example:

```
feat: persist roster data in SQLite with config-driven settings
feat(deploy): add WSGI entry point for production serving
chore: ignore build artifacts and untrack committed bytecode cache
docs: add README, changelog and configuration management notes
```

The changelog in `CHANGELOG.md` is derived from these commit types.

## Artifact management

- **Version controlled**: source code, tests, checked-in configuration (`config/app.json`) and documentation.
- **Never committed** (covered by `.gitignore`): Python bytecode (`__pycache__/`), the pytest cache (`.pytest_cache/`), virtual environments, and the runtime database (`data/`, `*.db`).
- **Secrets and machine-specific values** never enter the repository; they are supplied through environment variables at run time (see `docs/deployment.md`).
