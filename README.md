# LiftLogic

## Netlify Deployment

This app is configured for Netlify with `netlify.toml`.

- Base directory: `client`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`

The current Netlify setup deploys the Vite client only. The Express server is not deployed as part of this static Netlify build.
