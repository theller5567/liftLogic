# LiftLogic

## Netlify Deployment

This app is configured for Netlify with `netlify.toml`.

- Base directory: `client`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`
- Environment variables:
  - `VITE_API_BASE_URL=https://your-render-api.onrender.com`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

The current Netlify setup deploys the Vite client only. The Express server is not deployed as part of this static Netlify build.

## API and Database

The Express API is designed to run separately from Netlify, with MongoDB Atlas as the database.

Local setup:

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
2. Copy `client/.env.example` to `client/.env.local`.
3. Run the API with `npm --prefix server run dev`.
4. Run the client with `npm --prefix client run dev`.
5. Run a local API smoke test with `npm --prefix server run smoke`.

Production setup:

- Deploy `server` to Render as a Web Service.
- Set Render root directory to `server`.
- Set Render build command to `npm ci && npm run build`.
- Set Render start command to `npm start`.
- Set Render environment variables:
  - `MONGODB_URI=mongodb+srv://.../liftLogic?retryWrites=true&w=majority`
  - `CLIENT_ORIGIN=https://your-netlify-site.netlify.app`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- Set Netlify `VITE_API_BASE_URL` to the Render API URL.
- Run a Render API smoke test locally with:
  - `API_BASE_URL=https://your-render-api.onrender.com npm --prefix server run smoke`

## Firebase Google Auth

Firebase Google auth is the current sign-in method.

Firebase Console setup:

1. Create a Firebase project.
2. Add a Web app and copy its client config values into Netlify as `VITE_FIREBASE_*` variables.
3. Enable Authentication > Sign-in method > Google.
4. Add authorized domains for local development and Netlify, such as `localhost` and `your-netlify-site.netlify.app`.
5. Create a Firebase Admin service account key and add these values to Render:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - Or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full service account JSON as a single env var.

The client sends Firebase ID tokens to the API with `Authorization: Bearer <token>`. The API still supports `x-liftlogic-client-id` as a smoke-test and pre-auth fallback, but app users should be owned by verified Firebase UID records.

Rotate any MongoDB password that was exposed during setup before relying on production deploys.
