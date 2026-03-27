## Context

The repo already implements the core issuer-side primitives for a narrow OpenID4VCI-style flow in `@vidos-id/issuer`: credential offer creation, pre-authorized grant exchange, nonce generation, proof JWT validation, and `dc+sd-jwt` issuance. The wallet side already manages holder keys, imports issued credentials, and stores them behind a storage abstraction. What is missing is the protocol glue that lets a wallet consume a credential offer, talk to an issuer-hosted server, and store the issued credential without manual key exchange or manual import.

This change crosses three packages: `issuer`, `wallet`, and `wallet-cli`. It also introduces new request/response models, network interactions, and public package APIs that should stay small enough for Bun consumers embedding the issuer in a separate server application.

## Goals / Non-Goals

**Goals:**
- Add a minimal OID4VCI surface to `@vidos-id/issuer` that is suitable for embedding into a separate server application.
- Add a minimal OID4VCI client flow to `@vidos-id/wallet` that can receive a credential directly from an issuer offer and store it.
- Add a `wallet-cli` command that exercises the wallet-side direct issuance flow.
- Reuse the existing `dc+sd-jwt`, nonce, and proof JWT behavior already present in the repo.
- Keep the supported protocol subset explicit and small enough to test easily.

**Non-Goals:**
- Adding full OpenID4VCI coverage.
- Adding hosted HTTP server behavior to `issuer-cli`.
- Adding authorization-code flow, DPoP, wallet attestation, key attestation, `tx_code`, deferred issuance, encrypted credential responses, or batch issuance.
- Expanding beyond `dc+sd-jwt`.

## Decisions

### Decision: Add a dedicated wallet-side OID4VCI client module
- `@vidos-id/wallet` SHALL gain a dedicated OID4VCI client module, parallel to the existing `openid4vp.ts`, rather than folding network behavior into `wallet.ts`.
- The module SHALL own credential-offer parsing, issuer metadata retrieval, token exchange, nonce retrieval, proof JWT creation, credential request submission, and final import.
- Rationale: this keeps `wallet.ts` focused on storage and presentation concerns and makes the OID4VCI flow reusable from both library consumers and `wallet-cli`.
- Alternatives considered: embedding the whole flow into `wallet.ts` or into `wallet-cli`. Rejected because both would blur boundaries and make testing harder.

### Decision: Keep issuer library APIs request/response oriented and storage-agnostic
- `@vidos-id/issuer` SHALL expose helpers for OID4VCI metadata, credential-offer URI shaping, and endpoint request/response modeling, but SHALL not own HTTP routing or persistence.
- The issuer library SHALL continue returning updated grant/access-token/nonce records so host applications can persist them externally.
- Rationale: the user wants the issuer library to be embedded in a separate server application. Storage-agnostic APIs fit that hosting model and match the current `DemoIssuer` style.
- Alternatives considered: shipping a built-in HTTP server wrapper or CLI-hosted issuance server. Rejected because it would overfit this repo and conflict with the desired integration point.

### Decision: Support only the minimal pre-authorized-code offer flow
- The change SHALL support pre-authorized-code issuance only.
- The wallet SHALL support by-value credential offers and `openid-credential-offer://` URI parsing. Support for `credential_offer_uri` MAY be added only if it stays lightweight and does not complicate the core flow.
- Rationale: this is the smallest interoperable path that removes the current manual steps.
- Alternatives considered: adding authorization-code flow now or requiring only raw JSON offers. Rejected because they either add browser complexity or reduce interoperability.

### Decision: Reuse the existing proof and nonce model
- Wallet proof JWTs SHALL continue using `typ=openid4vci-proof+jwt` with issuer audience and issuer-provided nonce.
- Issuer metadata SHALL include `nonce_endpoint` whenever holder binding is supported.
- The wallet SHALL use its persisted holder key to create proof JWTs and SHALL import the resulting credential through the existing credential import path.
- Rationale: the repo already aligns with this subset, so the change can build on tested primitives instead of replacing them.
- Alternatives considered: issuing unbound credentials by default or relaxing nonce usage. Rejected because the main goal is direct holder-bound issuance.

### Decision: Borrow only low-cost HAIP-aligned constraints
- Credential configurations SHALL include `scope` in issuer metadata where possible.
- Issuers, wallets, and tests SHALL continue supporting ES256 as a baseline while keeping current broader algorithm support.
- Issued `dc+sd-jwt` credentials SHALL continue carrying `x5c` in the JOSE header when issuer trust material includes certificates.
- Rationale: these choices improve interoperability without bringing in the complexity of full HAIP features.
- Alternatives considered: implementing DPoP, wallet attestation, and key attestation immediately. Rejected because they are materially more complex than the repo’s target use case.

### Decision: Add a wallet-cli receive command instead of modifying import
- `wallet-cli` SHALL add a new direct-issuance command that consumes an offer and stores the issued credential.
- The existing `import` command SHALL remain focused on importing an already-issued credential blob.
- Rationale: receiving through OID4VCI is a distinct flow with network interactions and offer parsing, and keeping it separate makes the CLI contract clearer.
- Alternatives considered: overloading `import` with offer parsing. Rejected because it would mix local import and remote issuance behaviors under one command.

## Risks / Trade-offs

- [Offer-format ambiguity] -> Mitigate by explicitly documenting and validating the supported offer formats and URI scheme.
- [Networked wallet flow increases test complexity] -> Mitigate with mocked fetch coverage at the wallet package and CLI levels.
- [Partial HAIP alignment may confuse expectations] -> Mitigate by documenting the implemented subset and explicit deferrals.
- [Server hosts may expect persistence inside the issuer library] -> Mitigate by keeping record types and update flows explicit in the API design.
- [Credential verification may depend on issuer metadata shape] -> Mitigate by reusing the current wallet import verification path and adding end-to-end tests around metadata retrieval.

## Migration Plan

- Add the new OID4VCI helper modules and schemas to `@vidos-id/issuer` and `@vidos-id/wallet` without removing existing APIs.
- Add the new `wallet-cli` command on top of the new wallet package APIs.
- Update README and package docs to distinguish manual import from direct offer-based issuance.
- Rollback is limited to removing the new OID4VCI-specific modules and CLI command because existing issuance and presentation flows remain intact.

## Open Questions

- Whether to support `credential_offer_uri` in the first implementation or defer it to a follow-up change.
- What the final `wallet-cli` command name should be: `receive`, `accept-offer`, or similar.
