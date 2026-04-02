# @vidos-id/openid4vc-issuer-cli

Terminal client for [`@vidos-id/openid4vc-issuer-web-server`](../issuer-web-server/).

This CLI no longer issues credentials locally or manages issuer key material. It signs into a running issuer web server, manages templates and issuance offers, and exposes the same app-level workflows as the web client in a terminal-friendly form.

For wallet-side credential receipt and storage, use [`@vidos-id/openid4vc-wallet-cli`](../wallet-cli/).

## Install

Install the published CLI from npmjs:

```bash
bun install -g @vidos-id/openid4vc-issuer-cli
openid4vc-issuer --help
```

Or with npm:

```bash
npm install -g @vidos-id/openid4vc-issuer-cli
openid4vc-issuer --help
```

For development in this repo, run the bin entry directly with Bun:

```bash
bun packages/issuer-cli/src/cli.ts --help
```

## What It Does

- sign in to a local or remote issuer web server
- support guest sessions and username/password accounts
- inspect the issuer metadata published at `/.well-known/openid-credential-issuer`
- list, create, and delete templates
- list issuances, create new issuance offers, inspect offer URIs, and update status
- provide an interactive terminal flow with prompts and menus

Running `openid4vc-issuer` with no subcommand starts the interactive mode by default.

## Server

Run the API separately:

```bash
bun run --filter '@vidos-id/openid4vc-issuer-web-server' dev
```

Default local server URL:

- `http://localhost:3001`

Most commands use the saved session server automatically. You can override it with `--server-url`.

## Session Storage

By default the CLI stores the authenticated session at:

- `~/.config/vidos-id/openid4vc-issuer-session.json`

Override it with `--session-file <file>`.

## Commands

### `auth signin`

Sign in with either a guest session or username/password.

```bash
openid4vc-issuer auth signin --anonymous
openid4vc-issuer auth signin --server-url http://localhost:3001 --username ada --password secret
```

### `auth signup`

Create an account and save the resulting session.

```bash
openid4vc-issuer auth signup --username ada --password secret
```

### `auth whoami`

Show the saved session.

```bash
openid4vc-issuer auth whoami
```

### `auth signout`

Sign out and clear the saved session file.

```bash
openid4vc-issuer auth signout
```

### `metadata`

Show the issuer metadata document exposed by the server.

```bash
openid4vc-issuer metadata
openid4vc-issuer metadata --server-url http://localhost:3001 --output json
```

### `templates list`

List the predefined and custom templates visible to the current user.

```bash
openid4vc-issuer templates list
```

### `templates create`

Create a custom template.

```bash
openid4vc-issuer templates create \
  --name "Conference Pass" \
  --vct https://issuer.example/credentials/conference-pass \
  --claims '{"given_name":"Ada","pass_level":"speaker"}'

openid4vc-issuer templates create \
  --name "PID" \
  --vct urn:eudi:pid:1 \
  --claims-file examples/pid/pid-minimal.claims.json
```

### `templates delete`

Delete a custom template by id.

```bash
openid4vc-issuer templates delete --template-id <template-id>
```

### `issuances list`

List issuances for the current user.

```bash
openid4vc-issuer issuances list
```

### `issuances create`

Create an issuance offer from a template. The output includes the `openid-credential-offer://` URI for wallet handoff.

```bash
openid4vc-issuer issuances create \
  --template-id <template-id> \
  --claims '{"seat":"A-12"}' \
  --status active
```

### `issuances show`

Show one issuance, including its current state, claims, and offer URI.

```bash
openid4vc-issuer issuances show --issuance-id <issuance-id>
```

### `issuances status`

Update credential status for an issuance.

```bash
openid4vc-issuer issuances status --issuance-id <issuance-id> --status suspended
openid4vc-issuer issuances status --issuance-id <issuance-id> --status revoked
```

## Interactive Mode

Start the interactive terminal flow by running the CLI without a subcommand:

```bash
openid4vc-issuer
openid4vc-issuer --server-url http://localhost:3001
```

The interactive mode can:

- choose the target server URL
- sign in as guest or with credentials
- inspect issuer metadata
- create and delete templates
- create issuances from a selected template
- inspect and update existing issuances

## Global options

- running `openid4vc-issuer` with no subcommand starts interactive mode
- `--server-url <url>` - override the issuer web server URL
- `--session-file <file>` - override the saved session file location
- `--verbose` - enable verbose logging to stderr
- `--version` - show version number
- `--help` - show help for a command

## Notes

- `openid4vc-issuer` is an app client of `openid4vc-issuer-web-server`; it does not issue locally
- `openid4vc-issuer` does not receive or store credentials; wallet redemption belongs to [`openid4vc-wallet receive`](../wallet-cli/)
- command output is concise text meant for terminal usage rather than raw JSON dumps

## Test

```bash
bun test packages/issuer-cli/src/index.test.ts
```
