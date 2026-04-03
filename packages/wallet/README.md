# @vidos-id/openid4vc-wallet

Minimal demo wallet library for importing, storing, and presenting `dc+sd-jwt` credentials.

For the CLI wrapper, see [`@vidos-id/openid4vc-wallet-cli`](../wallet-cli/). For the installed CLI flow, see the [root README](../../). For development, the CLI bin can be run with `bun packages/wallet-cli/src/index.ts`.

## Install

Configure GitHub Packages in the consuming repo:

```ini
@vidos-id:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Install with your preferred package manager:

```bash
# bun
bun add @vidos-id/openid4vc-wallet

# npm
npm install @vidos-id/openid4vc-wallet

# pnpm
pnpm add @vidos-id/openid4vc-wallet

# yarn
yarn add @vidos-id/openid4vc-wallet
```

This package is currently published as raw TypeScript and is intended for Bun-based consumers.

## Features

- holder-key generation (ES256, ES384, EdDSA)
- holder-key import from JWK
- pluggable storage interface
- issuer JWK/JWKS credential verification (optional)
- direct OID4VCI receipt from credential offers
- on-demand credential status resolution via Token Status List JWTs
- DCQL matching with `dcql`
- `openid4vp://` authorization URL parsing for by-value DCQL requests
- selective disclosure presentation building
- KB-JWT holder binding
- prepared `direct_post` and `direct_post.jwt` authorization response delivery

## Example

```ts
import {
  createOpenId4VpAuthorizationResponse,
  InMemoryWalletStorage,
  parseOpenid4VpAuthorizationUrl,
  prepareOpenId4VpAuthorizationResponseSubmission,
  submitPreparedOpenId4VpAuthorizationResponse,
  Wallet,
  receiveCredentialFromOffer,
} from "@vidos-id/openid4vc-wallet";

const wallet = new Wallet(new InMemoryWalletStorage());

// Default holder key algorithm is ES256; pass "ES384" or "EdDSA" for alternatives
await wallet.getOrCreateHolderKey("ES256");

// Import a credential (after issuing with the issuer library)
await wallet.importCredential({
  credential: "eyJ...",
});

// Optionally verify against issuer JWKS on import
await wallet.importCredential({
  credential: "eyJ...",
  issuer: { issuer: "https://issuer.example", jwks: { keys: [/* ... */] } },
});

// Receive directly from a minimal OID4VCI credential offer
await receiveCredentialFromOffer(
  wallet,
  'openid-credential-offer://?credential_offer=...'
);

// Or start from a by-reference offer URI
await receiveCredentialFromOffer(
  wallet,
  'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foffers%2Fperson-1'
);

// Endpoint resolution is metadata-driven:
// 1. parse the offer or fetch credential_offer_uri first
// 2. read credential_issuer from the resolved offer
// 3. fetch /.well-known/openid-credential-issuer[issuer-path]
// 4. use token_endpoint / credential_endpoint / optional nonce_endpoint from metadata

// Resolve credential status only when needed
const status = await wallet.getCredentialStatus("credential-id");

// Create a presentation from a DCQL request
const presentationRequest = {
  client_id: "https://verifier.example",
  nonce: "nonce-123",
  response_mode: "direct_post",
  response_uri: "https://verifier.example/response",
  dcql_query: {
    credentials: [
      {
        id: "person",
        format: "dc+sd-jwt",
        meta: { vct_values: ["https://example.com/PersonCredential"] },
      },
    ],
  },
};

const presentation = await wallet.createPresentation(presentationRequest);

const authorizationResponse = createOpenId4VpAuthorizationResponse(
  presentationRequest,
  presentation,
);

const preparedSubmission =
  await prepareOpenId4VpAuthorizationResponseSubmission(
    presentationRequest,
    authorizationResponse,
  );

// Default path: submit exactly as prepared.
await submitPreparedOpenId4VpAuthorizationResponse(preparedSubmission);

// Local/e2e path: rewrite the destination or deliver in-process.
await submitPreparedOpenId4VpAuthorizationResponse(
  {
    ...preparedSubmission,
    url: "http://127.0.0.1:3000/response",
  },
  {
    transport: async (submission) => {
      const body = Object.fromEntries(submission.body.entries());
      console.log(submission.url, body.vp_token);
      return Response.json({ redirect_uri: "http://localhost:3000/done" });
    },
  },
);

// Parse an openid4vp:// authorization URL
const request = await parseOpenid4VpAuthorizationUrl("openid4vp://authorize?...");
```

OID4VP response delivery flow:
- `createOpenId4VpAuthorizationResponse(...)` builds the protocol response payload
- `prepareOpenId4VpAuthorizationResponseSubmission(...)` builds the HTTP submission request
- `submitPreparedOpenId4VpAuthorizationResponse(...)` sends the prepared request with either the default fetch transport or a caller-provided transport

This keeps protocol construction in the wallet while letting callers:
- inspect the exact outgoing request before submission
- rewrite the destination URL for localhost or reverse-proxy setups
- submit in-process during tests without standing up a network proxy

Supported `openid4vp://` subset:
- by-value only
- requires `client_id`, `nonce`, and `dcql_query`
- rejects `request`, `request_uri`, `scope`, and Presentation Exchange input

Supported OID4VCI subset:
- by-value credential offers and by-reference `credential_offer_uri`
- pre-authorized-code flow only
- JWT proof only
- single `dc+sd-jwt` credential request + import

OID4VCI endpoint resolution:
- `receiveCredentialFromOffer` parses the offer input or fetches `credential_offer_uri`, then reads `credential_issuer`
- issuer metadata is fetched from `/.well-known/openid-credential-issuer` relative to that issuer
- if `credential_issuer` contains a path, that path is appended to the well-known URL
- the fetched metadata must repeat the same `credential_issuer`
- `token_endpoint` and `credential_endpoint` are taken from metadata, not hardcoded in the wallet
- `nonce_endpoint` is used only if the token response does not already include `c_nonce`
- there is no API to manually override discovered endpoints

Examples:
- `https://issuer.example` -> `https://issuer.example/.well-known/openid-credential-issuer`
- `https://issuer.example/tenant-a` -> `https://issuer.example/.well-known/openid-credential-issuer/tenant-a`

This allows issuers to use non-standard endpoint paths such as `/token` or `/credential`, as long as those exact URLs are returned in issuer metadata.

Current limitations:
- `credential_offer_uri` must return a supported by-value offer document
- issuer metadata must contain `token_endpoint`, `credential_endpoint`, `jwks`, and the requested credential configuration
- if the token response omits `c_nonce`, issuer metadata must provide `nonce_endpoint`

## See also

- [`@vidos-id/openid4vc-issuer`](../issuer/) - issuer library for credential issuance
- [`scripts/demo-e2e.ts`](../../scripts/demo-e2e.ts) - full programmatic flow including prepared OID4VP submission with local transport rewriting

## Test

```bash
bun test packages/wallet/src/wallet.test.ts
```
