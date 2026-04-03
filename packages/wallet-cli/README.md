# @vidos-id/openid4vc-wallet-cli

CLI for OpenID4VCI credential receipt, `dc+sd-jwt` wallet storage, IETF credential status resolution, and OpenID4VP presentation. Wraps the [`@vidos-id/openid4vc-wallet`](../wallet/) library.

For the full issue-hold-present flow, see the [root README](../../).

Prefer using this CLI for wallet tasks instead of re-implementing protocol steps in agent code. In particular, `openid4vc-wallet receive` already handles the supported OID4VCI offer redemption flow end to end.

Running `openid4vc-wallet` with no subcommand starts the interactive mode by default.

## Install

Install the published CLI from npmjs:

```bash
bun install -g @vidos-id/openid4vc-wallet-cli
openid4vc-wallet --help
```

Or with npm:

```bash
npm install -g @vidos-id/openid4vc-wallet-cli
openid4vc-wallet --help
```

For development in this repo, you can run the bin entry directly with Bun:

```bash
bun packages/wallet-cli/src/cli.ts --help
```

## Files in `--wallet-dir`

- `holder-key.json` - Holder key pair (private + public JWK)
- `wallet.json` - Wallet manifest with credential index
- `credentials/<credential-id>.json` - Stored credentials

## Interactive Mode

Run the CLI with no subcommand:

```bash
openid4vc-wallet
openid4vc-wallet --wallet-dir ./my-wallet
```

Interactive mode can:

- initialize a wallet if one does not exist yet
- receive credentials from OpenID4VCI offers
- browse stored credentials
- show credential details and status
- present credentials to verifiers
- import raw credentials as a fallback

## Commands

### `init`

Initialize a wallet directory and create (or import) a holder key.

```bash
openid4vc-wallet init --wallet-dir ./my-wallet
openid4vc-wallet init --wallet-dir ./my-wallet --alg EdDSA
openid4vc-wallet init --wallet-dir ./my-wallet --holder-key-file ./existing-key.jwk.json
openid4vc-wallet init --wallet-dir ./my-wallet --output json
```

### `receive`

Receive and store a credential from a minimal OpenID4VCI credential offer.

This is the primary way to add credentials into the wallet.

```bash
# From an openid-credential-offer URI
openid4vc-wallet receive \
  --wallet-dir ./my-wallet \
  --offer 'openid-credential-offer://?credential_offer=...'

# From inline credential-offer JSON
openid4vc-wallet receive \
  --wallet-dir ./my-wallet \
  --offer '{"credential_issuer":"https://issuer.example",...}'

# From a by-reference offer URI
openid4vc-wallet receive \
  --wallet-dir ./my-wallet \
  --offer 'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foffers%2Fperson-1'
```

Notes:
- default output is a concise text summary; use `--output json` for full details
- supports by-value `credential_offer` and by-reference `credential_offer_uri`
- resolves issuer metadata from `/.well-known/openid-credential-issuer[issuer-path]`
- uses advertised metadata endpoints instead of hardcoding paths

### `import`

Import an already-issued compact `dc+sd-jwt` credential.

Use this only when you already have the raw credential blob. Prefer `receive` whenever you have an OpenID4VCI offer.

```bash
openid4vc-wallet import \
  --wallet-dir ./my-wallet \
  --credential-file ./issuer/credential.txt
```

### `list`

List stored credentials.

```bash
openid4vc-wallet list --wallet-dir ./my-wallet
openid4vc-wallet list --wallet-dir ./my-wallet --vct urn:eudi:pid:1
openid4vc-wallet list --wallet-dir ./my-wallet --issuer https://issuer.example
```

### `show`

Show a single stored credential by id.

```bash
openid4vc-wallet show --wallet-dir ./my-wallet --credential-id <id>
openid4vc-wallet show --wallet-dir ./my-wallet --credential-id <id> --output raw
openid4vc-wallet show --wallet-dir ./my-wallet --credential-id <id> --output json
```

### `present`

Create a DCQL-based OpenID4VP presentation from wallet credentials.

```bash
openid4vc-wallet present \
  --wallet-dir ./my-wallet \
  --request 'openid4vp://authorize?...'

openid4vc-wallet present \
  --wallet-dir ./my-wallet \
  --request 'openid4vp://authorize?...' \
  --dry-run \
  --output json
```

## Global options

- running `openid4vc-wallet` with no subcommand starts interactive mode
- `--wallet-dir <dir>` - wallet directory for interactive mode
- `--verbose` - enable verbose logging to stderr
- `--version` - show version number
- `--help` - show help for a command

## Notes

- `receive` is the primary credential-ingest path
- `import` is a local raw-credential fallback
- `present` prepares `direct_post` and `direct_post.jwt` submissions automatically, then submits them unless `--dry-run` is set
- with `present --dry-run --output json`, the result includes `preparedSubmission` so callers can inspect the target URL, headers, and form body without sending anything
- when multiple credentials match a query, `present` prompts interactively in a TTY or returns an error with a `--credential-id` suggestion in non-interactive environments
- only by-value DCQL requests are supported
- `show` automatically fetches, verifies, and decodes IETF status list JWTs for stored credentials that include a `status.status_list` reference

## Test

```bash
bun test packages/wallet-cli/src/index.test.ts
```
