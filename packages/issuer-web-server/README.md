# @vidos-id/openid4vc-issuer-web-server

Hono + Bun API for the demo issuer web application.

## Local Dev

Uses committed local defaults from `.env.local`:

```bash
bun run --filter '@vidos-id/openid4vc-issuer-web-server' dev
```

Run the SPA separately:

```bash
bun run --filter '@vidos-id/openid4vc-issuer-web-client' dev
```

Default URL:

- `http://localhost:3001`

## Deployment

Deploy this package as an independent Bun service.

## Environment

- `ISSUER_WEB_PORT`
- `ISSUER_WEB_ORIGIN`
- `ISSUER_WEB_CLIENT_ORIGIN`
- `ISSUER_WEB_CLIENT_ORIGINS` comma-separated extra trusted browser origins
- `ISSUER_WEB_DATABASE_PATH`
- `ISSUER_WEB_AUTH_SECRET`
