## Why

The repo already has most of the internal building blocks for a minimal OpenID4VCI issuance flow, but issuing to a wallet still requires manual holder-key exchange and manual credential import. We need a small, pragmatic OID4VCI integration so an issuer-hosted server and the wallet packages can complete direct issuance end to end without taking on full-spec complexity.

## What Changes

- Add a minimal OID4VCI server-facing surface to `@vidos-id/issuer` for pre-authorized-code issuance of `dc+sd-jwt` credentials.
- Add a minimal OID4VCI client flow to `@vidos-id/wallet` that can resolve credential offers, fetch issuer metadata, exchange a pre-authorized code, prove holder key possession, request a credential, and store it directly.
- Add a `wallet-cli` command for consuming a credential offer and importing the issued credential in one step.
- Standardize the supported subset around by-value credential offers, issuer metadata retrieval, nonce-based JWT proof, single-credential issuance, and direct wallet import.
- Keep advanced OID4VCI and HAIP features such as authorization-code flow, DPoP, wallet attestation, key attestation, `tx_code`, deferred issuance, and batch issuance out of scope.

## Capabilities

### New Capabilities
- `issuer`: Minimal OID4VCI issuer behaviors for server applications that issue holder-bound `dc+sd-jwt` credentials through a pre-authorized-code flow.
- `wallet`: Minimal OID4VCI wallet behaviors for receiving credentials directly from issuer offers and storing them after issuance.
- `wallet-cli`: CLI support for direct wallet receipt of credentials from an OID4VCI credential offer.

### Modified Capabilities
- None.

## Impact

- Affects `packages/issuer`, `packages/wallet`, and `packages/wallet-cli` public APIs and tests.
- Adds protocol models and helpers for credential offers, issuer metadata, token exchange, nonce usage, proof JWT creation, and credential requests/responses.
- Adds wallet-side HTTP interactions and mocked network coverage for end-to-end issuance tests.
- Keeps `packages/issuer-cli` out of scope for hosted OID4VCI support in this change.
