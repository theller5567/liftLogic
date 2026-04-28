# LiftLogic

## Netlify Deployment

This app is configured for Netlify with `netlify.toml`.

- Build command: `npm --prefix client ci && npm --prefix client run build`
- Publish directory: `client/dist`
- SPA fallback: all routes redirect to `/index.html`

The current Netlify setup deploys the Vite client only. The Express server is not deployed as part of this static Netlify build.
