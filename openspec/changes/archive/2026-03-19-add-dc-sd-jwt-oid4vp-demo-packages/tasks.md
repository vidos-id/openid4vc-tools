## 1. Workspace and package setup

- [x] 1.1 Define workspace layout for `issuer`, `wallet`, `issuer-cli`, and `wallet-cli`
- [x] 1.2 Add shared Bun/TypeScript tooling, package scripts, and dependencies for `commander`, `zod`, `jose`, the selected `openwallet-foundation/sd-jwt-js` packages, and `dcql-ts`
- [x] 1.3 Add shared test setup and fixtures for demo credential types, keys, and protocol examples
- [x] 1.4 Define shared Zod-first schema/type composition conventions for validated inputs and plain TS type conventions for compile-time-only models

## 2. Issuer package

- [x] 2.1 Implement issuer configuration and metadata generation for a minimal `dc+sd-jwt` OpenID4VCI profile
- [x] 2.2 Implement minimal credential offer creation plus pre-authorized code grant creation and token endpoint exchange flow for demo issuance
- [x] 2.3 Implement nonce endpoint behavior, proof JWT validation with `openid4vci-proof+jwt`, and holder key extraction for credential requests
- [x] 2.4 Implement claim-set driven `dc+sd-jwt` credential issuance with `vct`, issuer claims, selective disclosures, and holder-bound `cnf`
- [x] 2.5 Implement issuer signing key publication through JWKS-backed metadata
- [x] 2.6 Implement composed Zod schemas and inferred types for validated issuer inputs
- [x] 2.7 Implement issuer key and certificate generation utilities plus verifier trust artifact export

## 3. Wallet package

- [x] 3.1 Implement a wallet storage abstraction for wallet-generated holder keys, credentials, and credential indexes
- [x] 3.2 Implement credential import flow with issuer metadata lookup and signature validation
- [x] 3.3 Implement reduced DCQL matching for `format`, `meta.vct_values`, and requested claim paths using `dcql-ts`
- [x] 3.4 Implement selective disclosure presentation building for stored `dc+sd-jwt` credentials
- [x] 3.5 Implement KB-JWT creation using `typ=kb+jwt`, verifier audience, nonce, and presented SD-JWT hash
- [x] 3.6 Implement composed Zod schemas and inferred types for validated wallet inputs
- [x] 3.7 Implement wallet holder-key generation and minimal `vp_formats_supported` metadata output
- [x] 3.8 Keep wallet request handling free of trusted-verifier or trusted-reader storage concerns in the initial version

## 4. CLI packages

- [x] 4.1 Implement `issuer-cli` commands for metadata inspection, offer/grant preparation, nonce retrieval, trust-material generation, and claim-set driven credential issuance with Zod-validated options
- [x] 4.2 Implement `wallet-cli` commands for credential import, list, show, and DCQL-based presentation generation with Zod-validated options
- [x] 4.3 Implement a filesystem-backed wallet storage adapter that stores credentials as separate files for `wallet-cli`
- [x] 4.4 Ensure CLI commands call into package APIs rather than duplicating protocol logic
- [x] 4.5 Ensure `wallet-cli` excludes local verifier behavior and rejects Presentation Exchange input

## 5. Verification and documentation

- [x] 5.1 Add unit tests for issuer metadata, proof validation, claim-set driven credential issuance, wallet storage abstraction behavior, DCQL matching, and holder-bound presentation creation
- [x] 5.2 Add lightweight end-to-end tests covering issuer-to-wallet issuance and wallet presentation generation
- [x] 5.3 Document the supported OpenID4VCI, SD-JWT VC, and OpenID4VP DCQL subset, detailed CLI options, and demo-only limitations
