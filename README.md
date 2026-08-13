# ReadHub Frontend

React 19 + Vite single-page app for the ReadHub reading platform. Talks to the
**readhub-backend** API and integrates Google OAuth and direct-to-storage uploads
via backend-issued **presigned S3 (MinIO) URLs**.

## Tech stack

- React 19 · Vite 7 · React Router 7 · Tailwind CSS 4
- axios · epub.js / pdf.js (react-pdf) · react-toastify
- Google OAuth (`@react-oauth/google`)

## Getting started

```bash
npm install
cp .env.example .env      # fill in real values
npm run dev               # Vite dev server (--host)
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Environment

`VITE_*` variables are read at **build time** — rebuild after changing them.
See [.env.example](.env.example):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend origin (no trailing slash, no `/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id (matches backend) |

Uploads no longer need a storage-provider variable: the frontend asks the backend
for a **presigned PUT URL** and uploads the file straight to it, then stores the
returned public URL.

## Deployment (VPS via Docker)

The app is built into static files and served by nginx (SPA fallback in
[`nginx/frontend.conf`](nginx/frontend.conf)). `VITE_*` values are baked in at
**build time**, so pass them as build args.

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.readhub.study \
  --build-arg VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com \
  -t readhub-frontend .
docker run -p 8080:80 readhub-frontend
```

## Deployment (CI)

Pushing to **`staging`** or **`main`** triggers `.github/workflows/build.yml`,
which resolves `VITE_API_BASE_URL` per environment (`api.staging.readhub.study`
for `staging`, `api.readhub.study` for `main`), builds the image with the `VITE_*`
values baked in, pushes it to GHCR, and dispatches a deploy to the
**readhub-infra** repo. Because `VITE_*` is compile-time, each environment gets
its own image. Developers ship by merging PRs — the edge Traefik, TLS and the
shared single-box topology live in
[readhub-infra](https://github.com/READHUB-STUDYAPP/readhub-infra).
