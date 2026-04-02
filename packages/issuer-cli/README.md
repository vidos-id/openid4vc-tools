# @vidos-id/issuer-cli

Terminal client for [`@vidos-id/issuer-web-server`](../issuer-web-server/).

This CLI no longer issues credentials locally or manages issuer key material. It signs into a running issuer web server, manages templates and issuance offers, and exposes the same app-level workflows as the web client in a terminal-friendly form.

For wallet-side credential receipt and storage, use [`@vidos-id/wallet-cli`](../wallet-cli/).

## Install

Download the latest GitHub Release artifact and make it executable:

```bash
curl -L -o issuer-cli https://github.com/vidos-id/oid4vp-cli-utils/releases/latest/download/issuer-cli.js
chmod +x issuer-cli
./issuer-cli --help
```

For development in this repo, run the bin entry directly with Bun:

```bash
bun packages/issuer-cli/src/index.ts --help
```

## What It Does

- sign in to a local or remote issuer web server
- support guest sessions and username/password accounts
- inspect the issuer metadata published at `/.well-known/openid-credential-issuer`
- list, create, and delete templates
- list issuances, create new issuance offers, inspect offer URIs, and update status
- provide an interactive terminal flow with prompts and menus

Running `issuer-cli` with no subcommand starts the interactive mode by default.

## Server

Run the API separately:

```bash
bun run --filter '@vidos-id/issuer-web-server' dev
```

Default local server URL:

- `http://localhost:3001`

Most commands use the saved session server automatically. You can override it with `--server-url`.

## Session Storage

By default the CLI stores the authenticated session at:

- `~/.config/vidos-id/issuer-cli-session.json`

Override it with `--session-file <file>`.

## Commands

### `auth signin`

Sign in with either a guest session or username/password.

```bash
issuer-cli auth signin --anonymous
issuer-cli auth signin --server-url http://localhost:3001 --username ada --password secret
```

### `auth signup`

Create an account and save the resulting session.

```bash
issuer-cli auth signup --username ada --password secret
```

### `auth whoami`

Show the saved session.

```bash
issuer-cli auth whoami
```

### `auth signout`

Sign out and clear the saved session file.

```bash
issuer-cli auth signout
```

### `metadata`

Show the issuer metadata document exposed by the server.

```bash
issuer-cli metadata
issuer-cli metadata --server-url http://localhost:3001 --output json
```

### `templates list`

List the predefined and custom templates visible to the current user.

```bash
issuer-cli templates list
```

### `templates create`

Create a custom template.

```bash
issuer-cli templates create \
  --name "Conference Pass" \
  --vct https://issuer.example/credentials/conference-pass \
  --claims '{"given_name":"Ada","pass_level":"speaker"}'

issuer-cli templates create \
  --name "PID" \
  --vct urn:eudi:pid:1 \
  --claims-file examples/pid/pid-minimal.claims.json
```

### `templates delete`

Delete a custom template by id.

```bash
issuer-cli templates delete --template-id <template-id>
```

### `issuances list`

List issuances for the current user.

```bash
issuer-cli issuances list
```

### `issuances create`

Create an issuance offer from a template. The output includes the `openid-credential-offer://` URI for wallet handoff.

```bash
issuer-cli issuances create \
  --template-id <template-id> \
  --claims '{"seat":"A-12"}' \
  --status active
```

### `issuances show`

Show one issuance, including its current state, claims, and offer URI.

```bash
issuer-cli issuances show --issuance-id <issuance-id>
```

### `issuances status`

Update credential status for an issuance.

```bash
issuer-cli issuances status --issuance-id <issuance-id> --status suspended
issuer-cli issuances status --issuance-id <issuance-id> --status revoked
```

## Interactive Mode

Start the interactive terminal flow by running the CLI without a subcommand:

```bash
issuer-cli
issuer-cli --server-url http://localhost:3001
```

The interactive mode can:

- choose the target server URL
- sign in as guest or with credentials
- inspect issuer metadata
- create and delete templates
- create issuances from a selected template
- inspect and update existing issuances

## Global options

- running `issuer-cli` with no subcommand starts interactive mode
- `--server-url <url>` - override the issuer web server URL
- `--session-file <file>` - override the saved session file location
- `--verbose` - enable verbose logging to stderr
- `--version` - show version number
- `--help` - show help for a command

## Notes

- `issuer-cli` is an app client of `issuer-web-server`; it does not issue locally
- `issuer-cli` does not receive or store credentials; wallet redemption belongs to [`wallet-cli receive`](../wallet-cli/)
- command output is concise text meant for terminal usage rather than raw JSON dumps

## Test

```bash
bun test packages/issuer-cli/src/index.test.ts
```
