# @vidos-id/openid4vc-issuer-web-client

React + Vite SPA for the demo issuer web application.

## Local Dev

Uses committed local defaults from `.env.local`:

```bash
bun run --filter '@vidos-id/openid4vc-issuer-web-client' dev
```

Run the API separately:

```bash
bun run --filter '@vidos-id/openid4vc-issuer-web-server' dev
```

Default URLs:

- app: `http://localhost:5174`
- API/server: `http://localhost:3001`

## Deployment

Build and deploy this package as a static SPA. Point it at the independently deployed server with:

- `VITE_ISSUER_WEB_SERVER_URL`
- `VITE_ISSUER_WEB_AUTH_URL`

## Features

- TanStack React Router SPA
- Better Auth signup/signin UX
- custom template creation
- issuance list and detail routes
- QR rendering for wallet handoff

## Routes

- `/signin`
- `/`
- `/issuances/:issuanceId`
