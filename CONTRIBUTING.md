# Contributing — ReadHub Frontend

Thanks for contributing! This repo uses a **three-tier branch model** with a
strict one-directional promotion flow. Read this before opening a PR so changes
land on the right branch and nothing gets mixed up.

## Branch model

| Branch | Role | Deploys to | Who writes to it |
|---|---|---|---|
| `main` | Production. Always releasable. | Production | **PRs from `staging` only** |
| `staging` | Pre-production QA / release candidate. | Staging | **PRs from `dev` only** |
| `dev` | Active integration branch. **Default branch.** | Dev | PRs from work branches |

`main` and `staging` are **protected**: no direct commits, no force-pushes.

## Promotion flow (one direction only)

```
feature/*  ─PR→  dev  ─PR→  staging  ─PR→  main
  (your work)          (integrate)   (QA)      (release)
```

- Never commit directly to `dev`, `staging`, or `main`.
- Never open a PR that skips a tier (e.g. `feature → main` or `dev → main`).
- Promotion is always **upward and adjacent**: `dev → staging → main`.

## Working branches

Branch off **`dev`** (except hotfixes — see below). Name by type:

| Prefix | Use |
|---|---|
| `feature/` | New functionality — `feature/vertical-reader` |
| `fix/` | Bug fix — `fix/pdf-page-jump` |
| `chore/` | Tooling, deps, config — `chore/bump-vite` |
| `docs/` | Docs only — `docs/readme` |

```bash
git checkout dev && git pull
git checkout -b feature/my-change
# ...work...
git push -u origin feature/my-change   # then open a PR into dev
```

## Opening a PR

1. **Target the right base branch** (`dev` for normal work).
2. Fill in what changed and why; link the issue. Include screenshots for UI.
3. Ensure checks pass locally before requesting review:
   ```bash
   npm install
   npm run lint        # ESLint, must be clean
   npm run build       # vite build, must succeed
   ```
4. CI must be green and at least **one approval** is required.
5. **Do not auto-merge into `main`.** Merges to `main` are deliberate releases.
6. Use **Squash and merge** into `dev`; use **Merge commit** for
   `dev → staging` and `staging → main` promotions (preserves history).

> Note: `VITE_*` env vars are baked in at **build time**. A change that needs a
> new/renamed variable must update `.env.example` and be called out in the PR so
> each environment's build config is updated.

## Hotfixes (production emergencies)

1. Branch off `main`: `git checkout -b hotfix/<issue> main`.
2. PR the hotfix into `main`.
3. **Back-merge** the fix down so branches don't diverge: `main → staging → dev`
   (open PRs, or cherry-pick).

## Commit messages

Use clear, imperative subjects; Conventional Commits encouraged:

```
feat(reader): add vertical scroll mode
fix(auth): redirect to login on 401
chore(deps): bump react-router to 7.13
```

## Code style

- ESLint + Prettier — keep `npm run lint` clean.
- Match the existing structure under `src/` (Components / Context / Features /
  Util / services).
- Don't commit secrets. Only `.env.example` is tracked; real `.env` is ignored.
