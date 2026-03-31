# oid4vp-cli-utils

CLI tools for quick `dc+sd-jwt` credential issuance, holding, and OpenID4VP presentation.

Built for simple, scriptable credential flows -- primarily created as a PoC for making wallet operations CLI-consumable so they can be driven by AI agents like [OpenClaw](https://openclaw.ai/) 🦞.

The repo also supports a minimal OpenID4VCI direct issuance subset: by-value credential offers, pre-authorized-code token exchange, issuer nonce retrieval, JWT proof-of-possession, single `dc+sd-jwt` issuance, and direct wallet import.

## Packages

| Package | Description |
|---------|-------------|
| [`@vidos-id/issuer-cli`](packages/issuer-cli/) | Terminal client for `issuer-web-server` |
| [`@vidos-id/wallet-cli`](packages/wallet-cli/) | Hold credentials and create OpenID4VP presentations |
| [`@vidos-id/issuer`](packages/issuer/) | Issuer library used by the CLI and Bun consumers |
| [`@vidos-id/wallet`](packages/wallet/) | Wallet library used by the CLI and Bun consumers |
| [`@vidos-id/cli-common`](packages/cli-common/) | Shared CLI utilities published for the CLI packages |

## Install

Library packages and CLI packages are published to GitHub Packages under the `@vidos-id` scope. Release artifacts are also published on GitHub Releases as Bun-executable single-file CLIs.

Requirements:

- [Bun](https://bun.sh/) installed

### GitHub Packages

Configure the `@vidos-id` scope in the consuming repo or your user config.

With `.npmrc`:

```ini
@vidos-id:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

With `bunfig.toml`:

```toml
[install.scopes]
"@vidos-id" = { url = "https://npm.pkg.github.com", token = "$GITHUB_PACKAGES_TOKEN" }
```

Install the libraries with your preferred package manager:

```bash
# bun
bun add @vidos-id/wallet @vidos-id/issuer

# npm
npm install @vidos-id/wallet @vidos-id/issuer

# pnpm
pnpm add @vidos-id/wallet @vidos-id/issuer

# yarn
yarn add @vidos-id/wallet @vidos-id/issuer
```

### GitHub CLI Releases

Download the latest release assets:

```bash
# wallet-cli
curl -L -o wallet-cli https://github.com/vidos-id/oid4vp-cli-utils/releases/latest/download/wallet-cli.js
chmod +x wallet-cli

# issuer-cli
curl -L -o issuer-cli https://github.com/vidos-id/oid4vp-cli-utils/releases/latest/download/issuer-cli.js
chmod +x issuer-cli
```

Run them directly:

```bash
./wallet-cli --help
./issuer-cli --help
```

Optional: install globally on your machine by moving them onto your `PATH`:

```bash
mv wallet-cli ~/.local/bin/wallet-cli
mv issuer-cli ~/.local/bin/issuer-cli
```

These artifacts are built for Bun and do not require GitHub Packages registry configuration.

Note: the GitHub Release assets only contain the CLIs, not the `examples/` directory. When using the installed CLIs, either supply your own local files or fetch example inputs from the repo's raw GitHub URLs.

For development in this repo, you can run the package bin entry directly with Bun:

```bash
bun packages/wallet-cli/src/index.ts --help
bun packages/issuer-cli/src/index.ts --help
```

## Quick Start

Use the CLIs for end-to-end flows rather than re-implementing protocol steps in agent code. `issuer-cli` now works as a client of `issuer-web-server`, while `wallet-cli` keeps wallet-side receipt, storage, and presentation concerns. `wallet-cli receive` is the primary way to add credentials into a wallet.

The minimal server-backed flow:

```bash
# 1. Start the issuer web server
bun run --filter '@vidos-id/issuer-web-server' dev

# 2. Initialize a wallet
./wallet-cli init --wallet-dir .demo/wallet

# 3. Sign into the issuer app from the terminal
./issuer-cli auth signin --anonymous

# 4. Create a template
./issuer-cli templates create \
  --name "PID" \
  --vct urn:eudi:pid:1 \
  --claims "$(curl -fsSL https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-minimal.claims.json)"

# 5. Create an issuance offer from that template
./issuer-cli issuances create \
  --template-id <template-id> \
  --claims '{"issuing_state":"demo"}'

# 6. Redeem that offer with the wallet
./wallet-cli receive \
  --wallet-dir .demo/wallet \
  --offer 'openid-credential-offer://?...'
```

Both CLIs also support interactive mode by default when run with no subcommand:

```bash
./issuer-cli
./wallet-cli
```

Then present it:

```bash
./wallet-cli present \
  --wallet-dir .demo/wallet \
  --request "$(curl -fsSL https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-basic-request.json)"
```

Or from an `openid4vp://` authorization URL:

```bash
./wallet-cli present \
  --wallet-dir .demo/wallet \
  --request 'openid4vp://authorize?client_id=https%3A%2F%2Fverifier.example&nonce=n-1&response_type=vp_token&dcql_query=...'
```

See [`@vidos-id/issuer-cli`](packages/issuer-cli/) and [`@vidos-id/wallet-cli`](packages/wallet-cli/README.md) for full command reference.

## Minimal OID4VCI

Wallet-side offer redemption is exposed through `wallet-cli receive`, and that is the primary ingest path for credentials.

Example:

```bash
wallet-cli receive \
  --wallet-dir .demo/wallet \
  --offer 'openid-credential-offer://?credential_offer=...'
```

For supported inputs, behavior, and command options, see [`packages/wallet-cli/README.md`](packages/wallet-cli/README.md) or run `wallet-cli receive --help`.

## Interactive Issuer Flow

`issuer-cli` also supports an interactive menu-driven mode by default when you run it without a subcommand:

```bash
./issuer-cli
```

It can sign in, create templates, create issuance offers, inspect offer URIs, and update issuance status without having to remember every command flag.

## End-To-End Demo Script

```bash
bun scripts/demo-e2e.ts
bun scripts/demo-oid4vci-e2e.ts
```

Runs the full flow programmatically: creates an issuance flow, receives a credential, and creates a presentation.

The OID4VCI demo exercises by-value credential offers, metadata discovery, pre-authorized-code exchange, nonce-based proof creation, direct issuance, and wallet storage.

## Example Inputs

Reusable example payloads live in `examples/pid/` in this repo and can also be fetched from raw GitHub:

- `pid-minimal.claims.json` - minimal PID-style SD-JWT VC claims - `https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-minimal.claims.json`
- `pid-full.claims.json` - broader PID-style SD-JWT VC claims - `https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-full.claims.json`
- `pid-basic-request.json` - basic PID DCQL request - `https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-basic-request.json`
- `pid-address-request.json` - address-focused PID DCQL request - `https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-address-request.json`
- `pid-basic.openid4vp.txt` - by-value `openid4vp://` authorization URL example - `https://raw.githubusercontent.com/vidos-id/oid4vp-cli-utils/main/examples/pid/pid-basic.openid4vp.txt`

## Validate

```bash
bun test
bun run check-types
bun run lint
```

## Notes

- `dc+sd-jwt` format only
- minimal OpenID4VCI direct issuance only; advanced OID4VCI/HAIP features are intentionally unsupported
- DCQL only, no Presentation Exchange
- `openid4vp://` limited to by-value requests with `client_id`, `nonce`, and `dcql_query`
- wallet trust store for verifiers/readers is out of scope
- issuer web server owns issuer state and protocol endpoints; `issuer-cli` is only an app client
