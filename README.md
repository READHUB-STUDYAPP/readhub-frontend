# ReadHub Frontend

React 19 + Vite single-page app for the ReadHub reading platform. Talks to the
**readhub-backend** API and integrates Google OAuth and Cloudinary uploads.

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
| `VITE_CLOUDINARY_NAME` | Public Cloudinary cloud name |

## Deployment (VPS via Docker)

The app is built into static files and served by nginx (SPA fallback in
[`nginx/frontend.conf`](nginx/frontend.conf)). `VITE_*` values are baked in at
**build time**, so pass them as build args.

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://readhub.example.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com \
  --build-arg VITE_CLOUDINARY_NAME=your_cloud \
  -t readhub-frontend .
docker run -p 8080:80 readhub-frontend
```

On the server, copy `.env.example` to `.env` and fill in the real values first
(the build reads them). Orchestration for the VPS — the edge nginx that serves
this app and proxies `/api` to the backend, TLS, etc. — lives in the
**readhub-infra** repository.
