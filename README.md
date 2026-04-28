# LiftLogic

## Netlify Deployment

This app is configured for Netlify with `netlify.toml`.

- Base directory: `client`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`

The current Netlify setup deploys the Vite client only. The Express server is not deployed as part of this static Netlify build.

## API and Database

The Express API is designed to run separately from Netlify, with MongoDB Atlas as the database.

Local setup:

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
2. Copy `client/.env.example` to `client/.env.local`.
3. Run the API with `npm --prefix server run dev`.
4. Run the client with `npm --prefix client run dev`.

Production setup:

- Deploy `server` to Render.
- Set Render environment variables from `server/.env.example`.
- Set Netlify `VITE_API_BASE_URL` to the Render API URL.
- Set Render `CLIENT_ORIGIN` to the Netlify site URL.
