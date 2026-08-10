# Nines九 Records

[![Netlify Status](https://api.netlify.com/api/v1/badges/ca8f0bfe-bb37-4833-be3f-7fd92328d405/deploy-status)](https://app.netlify.com/projects/nines-records/deploys)

A virtual record player / turntable UI that plays full songs through Spotify.
Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Zustand,
using the Spotify Web Playback SDK and Web API. Requires Spotify Premium.

Everything runs client-side (Authorization Code with PKCE) — no backend, deployable as a static site.

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Nines-kyu/nines-records.git
   cd nines-records
   npm install
   ```

2. Create a Spotify app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   and add a redirect URI matching your dev/prod URL (e.g. `http://127.0.0.1:9799/callback`).

3. Generate your local `.env` from the template:

   ```bash
   npm run setup:env
   ```

   This copies `.env.example` to `.env` (leaving an existing `.env` untouched)
   and prints what each variable needs. Then fill in `.env`:

   ```bash
   # .env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id       # from the Spotify dashboard app you created above
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:9799/callback  # must match a redirect URI on that app
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Deployment (Netlify)

This is a static build (`npm run build` → `dist/`), so any static host works. For Netlify:

1. Build command: `npm run build`, publish directory: `dist`
2. Set `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI` (e.g. `https://your-site.netlify.app/callback`)
   as environment variables in Site settings
3. Add that same redirect URI to the Spotify app's Redirect URIs (you can register both the
   localhost and production URIs on the same app)
4. `public/_redirects` is already set up to serve `index.html` for all paths — needed because
   `/callback` is handled client-side, not by a real server route

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build locally
- `npm run setup:env` — create `.env` from `.env.example` (safe to re-run, won't overwrite an existing `.env`)
