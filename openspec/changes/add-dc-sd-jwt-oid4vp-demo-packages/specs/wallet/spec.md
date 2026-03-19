## ADDED Requirements

### Requirement: Wallet package abstracts credential storage and holder keys
The `wallet` package MUST generate and persist a holder key together with issued `dc+sd-jwt` credentials and metadata needed to present them later through a storage abstraction or equivalent pluggable persistence approach. The storage model MUST be lightweight and suitable for local CLI/demo usage across process restarts.

#### Scenario: Wallet stores an issued credential through the abstraction
- **WHEN** the wallet receives a valid issued `dc+sd-jwt` credential for a holder key it controls
- **THEN** it persists the credential, its related metadata, and the holder key reference through the configured storage abstraction

#### Scenario: Wallet generates a holder key
- **WHEN** a wallet instance is initialized without an existing holder key
- **THEN** the wallet generates a holder key and persists it through the configured storage abstraction for later issuance and presentation use

#### Scenario: Wallet reloads stored credentials
- **WHEN** the wallet is restarted and reopens its storage
- **THEN** previously stored credentials and holder key references remain available for later presentation

### Requirement: Wallet package verifies and indexes issuer-bound dc+sd-jwt credentials
Before storing a credential, the `wallet` package MUST validate the issuer signature using issuer key metadata and MUST reject credentials that do not meet the minimal supported `dc+sd-jwt` profile. The `wallet` package MUST index stored credentials by identifiers useful for matching presentation requests, including issuer and `vct`.

#### Scenario: Valid credential is accepted for storage
- **WHEN** the wallet receives a credential whose signature verifies against the issuer metadata and whose payload matches the supported profile
- **THEN** the wallet accepts and indexes the credential for future lookup

#### Scenario: Invalid credential is rejected from storage
- **WHEN** the wallet receives a credential with an invalid signature or unsupported required profile fields
- **THEN** the wallet rejects the credential and does not persist it

### Requirement: Wallet package matches a reduced OpenID4VP DCQL profile
The `wallet` package MUST support a reduced OpenID4VP request profile for `vp_token` requests over `dcql_query`. The supported query subset MUST include credential selection by `format=dc+sd-jwt`, `meta.vct_values`, and requested claim paths. The `wallet` package MUST use `dcql-ts` for DCQL parsing and handling where the library covers the supported subset. The `wallet` package MUST NOT require or implement Presentation Exchange support.

#### Scenario: Wallet finds a matching credential
- **WHEN** the wallet processes an OpenID4VP request whose DCQL query asks for a supported `dc+sd-jwt` credential type present in storage
- **THEN** the wallet selects a stored credential that matches the requested `vct` and claim paths

#### Scenario: Wallet reports no match for unsupported query
- **WHEN** the wallet processes an OpenID4VP request that requires unsupported formats or no stored credential satisfies the supported query subset
- **THEN** the wallet returns a no-match or request-rejection outcome instead of producing a presentation

#### Scenario: Wallet rejects non-DCQL request forms
- **WHEN** the wallet processes a presentation request that relies on Presentation Exchange or `scope`-encoded queries instead of `dcql_query`
- **THEN** the wallet rejects the request as unsupported in the demo profile

### Requirement: Wallet package produces holder-bound dc+sd-jwt presentations
The `wallet` package MUST produce OpenID4VP presentation payloads containing `dc+sd-jwt` presentations and MUST support holder binding using KB-JWT derived from the holder key bound in the credential `cnf`. The KB-JWT MUST use `typ=kb+jwt`, bind the presentation to the verifier audience and request nonce, and the final holder-bound presentation serialization MUST be `SD-JWT~KB-JWT`.

#### Scenario: Wallet creates selective disclosure presentation
- **WHEN** the wallet presents a stored `dc+sd-jwt` credential for a query requesting a subset of claims
- **THEN** the resulting presentation contains only the disclosures needed for the selected claims plus the issuer-signed SD-JWT component

#### Scenario: Wallet creates key-bound presentation
- **WHEN** the OpenID4VP request requires cryptographic holder binding
- **THEN** the wallet appends a KB-JWT signed by the holder key and that KB-JWT includes the verifier audience, request nonce, and hash of the presented SD-JWT

### Requirement: Wallet package performs minimal verifier metadata validation
The `wallet` package MUST perform only the minimal presentation-request validation needed to safely construct a presentation in the supported demo profile. The wallet package MUST NOT require a trusted-verifier or trusted-reader store in this initial version.

#### Scenario: Wallet accepts minimally sufficient verifier input
- **WHEN** the wallet receives a request containing the supported DCQL request structure plus the verifier identifiers and nonce needed for holder binding
- **THEN** the wallet proceeds without attempting full verifier trust-framework validation or consulting a trusted-verifier store

### Requirement: Wallet package uses dcql-ts for DCQL handling
The `wallet` package MUST prefer `dcql-ts` from `openwallet-foundation-labs` for parsing and handling DCQL inputs instead of implementing DCQL primitives from scratch.

#### Scenario: Wallet parses supported DCQL through library integration
- **WHEN** the package receives a supported `dcql_query` input
- **THEN** the package parses and handles that query through `dcql-ts` where the library covers the supported subset rather than custom DCQL primitives

### Requirement: Wallet package exposes dc+sd-jwt format capability metadata
The `wallet` package MUST be able to describe its supported `dc+sd-jwt` presentation capabilities for use in OpenID4VP-compatible interactions.

#### Scenario: Wallet reports supported format algorithms
- **WHEN** a caller asks the wallet for supported presentation format metadata
- **THEN** the wallet returns `vp_formats_supported` data for `dc+sd-jwt` including its supported SD-JWT and KB-JWT algorithms

### Requirement: Wallet package uses Zod-first schema composition for validated inputs
The `wallet` package MUST define runtime-validated protocol, storage, and import inputs using Zod schemas with inferred TypeScript types where runtime validation is needed. When only compile-time typing is needed, the package MUST use plain TypeScript types. Related schemas and types MUST be composed rather than duplicated.

#### Scenario: Wallet validates external input with composed schemas
- **WHEN** a caller passes wallet configuration, storage records, imported credentials, or OpenID4VP request input into validated package entry points
- **THEN** the package validates those inputs with composed Zod schemas and exposes inferred types from those schemas instead of duplicating runtime and static models

### Requirement: Wallet package uses sd-jwt-js for sd-jwt handling
The `wallet` package MUST prefer the `openwallet-foundation/sd-jwt-js` family of libraries for SD-JWT parsing, disclosure selection, and presentation building instead of implementing SD-JWT primitives from scratch.

#### Scenario: Wallet builds presentations through library integration
- **WHEN** the package imports or presents a `dc+sd-jwt` credential
- **THEN** SD-JWT parsing and disclosure handling are produced through the chosen sd-jwt-js library integration rather than custom SD-JWT primitives
