# GotecxPOS

GotecxPOS is a Liberia-focused point-of-sale and business management frontend. It defaults to Liberian dollars (LRD), supports USD, and is designed to work for different kinds of local businesses.

## Run locally

```sh
pnpm install
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/gotecx-pos run dev
```

## GitHub checks

The GitHub Actions workflow in `.github/workflows/ci.yml` installs the workspace, runs the TypeScript checks, and builds GotecxPOS on pushes to `main` and pull requests.

## Deploy with Vercel

Import the repository into Vercel with the repository root (`.`) as the project root. The root `vercel.json` sets the app build command, static output directory, and client-side route fallback.

## Frontend-only demo

The current version stores demo business information in the browser. It does not provide secure authentication, shared accounts, cross-device synchronization, or live payment processing. Those require a backend and provider integrations before production use.
