## Why

The repo needs a small, practical baseline for issuing and presenting `dc+sd-jwt` credentials without pulling in production-grade complexity. We need an internal/demo-friendly path that proves the end-to-end flow across issuance, wallet storage, selective disclosure, and holder-bound presentation using familiar Bun/TypeScript tooling.

## What Changes

- Add an `issuer` utility package that accepts a caller-provided claim set, generates issuer key and certificate material, and issues those claims as holder-bound `application/dc+sd-jwt` credentials through a minimal OpenID4VCI flow.
- Add a `wallet` utility package that stores issued `dc+sd-jwt` credentials, tracks holder keys, exposes storage abstractions, and produces OpenID4VP presentations with key binding.
- Add two separate CLI packages, `issuer-cli` and `wallet-cli`, that consume the utility packages without introducing verifier behavior.
- Define a narrow interoperability profile that intentionally supports only the basic `dc+sd-jwt` path, a small subset of OpenID4VCI, and DCQL-based OpenID4VP requests needed for demos.
- Use a minimal OpenID4VCI pre-authorized code flow with token exchange and credential offer support where needed for demo initiation, while keeping optional `tx_code` and batch issuance out of scope.
- Require simple unit tests for core issuance, storage, and presentation behavior, with optional but encouraged lightweight integration tests for end-to-end flows.
- Standardize validation and modeling around Zod-first schemas with inferred types where runtime validation is needed.

## Capabilities

### New Capabilities
- `issuer`: Generate issuer trust material and issue caller-provided claim sets as holder-bound `dc+sd-jwt` credentials through a minimal OpenID4VCI-compatible interface for internal/demo use.
- `wallet`: Store `dc+sd-jwt` credentials behind a storage abstraction and present them through a minimal OpenID4VP-compatible flow with holder binding.
- `issuer-cli`: Provide a separate CLI package that exercises issuer package flows for local demos and testing.
- `wallet-cli`: Provide a separate CLI package that exercises wallet package flows for local demos and testing without local verifier behavior.

### Modified Capabilities
- None.

## Impact

- Adds new Bun/TypeScript packages named `issuer`, `wallet`, `issuer-cli`, and `wallet-cli`.
- Introduces dependencies around `commander`, `zod`, `jose`, `@sd-jwt/*` packages from `openwallet-foundation/sd-jwt-js`, and `dcql-ts` from `openwallet-foundation-labs` instead of custom crypto/protocol implementations.
- Defines public TypeScript APIs and CLI contracts for demo issuance and presentation workflows.
- Adds issuer key/certificate generation utilities and trust artifacts that can be configured in external verifiers.
- Adds unit tests for protocol shaping and core credential lifecycle behavior, plus optional lightweight integration coverage for end-to-end demo flows.
