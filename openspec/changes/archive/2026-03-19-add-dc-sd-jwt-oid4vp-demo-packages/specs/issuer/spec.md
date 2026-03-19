## ADDED Requirements

### Requirement: Issuer package supports minimal OpenID4VCI for dc+sd-jwt
The `issuer` package MUST publish and process a minimal OpenID4VCI profile sufficient to issue holder-bound `dc+sd-jwt` credentials for internal/demo use. The supported profile MUST expose issuer metadata, token exchange for a pre-authorized code grant, and a credential endpoint that returns `dc+sd-jwt` credentials.

#### Scenario: Wallet discovers issuer capabilities
- **WHEN** a wallet reads the issuer metadata from the configured issuer identifier
- **THEN** it receives metadata containing the credential issuer identifier, credential endpoint, nonce endpoint, and at least one `dc+sd-jwt` credential configuration exposed through `credential_configurations_supported`

#### Scenario: Wallet exchanges a pre-authorized code
- **WHEN** a wallet submits a token request using `grant_type=urn:ietf:params:oauth:grant-type:pre-authorized_code` with a valid pre-authorized code
- **THEN** the issuer returns an access token that can be used at the credential endpoint for the requested credential configuration

#### Scenario: Optional tx_code is out of scope
- **WHEN** a caller or wallet attempts to use `tx_code` in the supported profile
- **THEN** the issuer rejects or documents that path as unsupported for this demo implementation

### Requirement: Issuer package supports a minimal credential offer flow
The `issuer` package MUST be able to create a minimal credential offer suitable for starting the supported pre-authorized issuance flow.

#### Scenario: Issuer creates a credential offer for a supported configuration
- **WHEN** a caller requests a credential offer for a supported credential configuration
- **THEN** the issuer returns an offer containing the credential issuer identifier, the supported `credential_configuration_id`, and the pre-authorized code data needed to continue the flow

### Requirement: Issuer package issues caller-provided claim sets as holder-bound dc+sd-jwt credentials
The `issuer` package MUST accept a caller-provided claim set and issue those claims as `application/dc+sd-jwt` with a JOSE header `typ` value of `dc+sd-jwt`. Each issued credential MUST include a collision-resistant `vct` value and MUST support cryptographic holder binding by including `cnf` bound to the holder key proven during issuance.

#### Scenario: Credential is issued from a supplied claim set
- **WHEN** a caller asks the `issuer` package to issue a credential for a supported credential configuration and provides a claim set
- **THEN** the resulting credential contains the provided claims, is encoded as `dc+sd-jwt`, and includes `typ=dc+sd-jwt` and a `vct` claim in the issuer-signed payload

#### Scenario: Credential binds to the holder key
- **WHEN** the wallet proves possession of a holder key during the credential request
- **THEN** the issuer embeds the corresponding public key material in the credential `cnf` claim and signs the credential after binding that key

### Requirement: Issuer package validates issuance proof inputs
The `issuer` package MUST require a proof JWT for holder-bound issuance and MUST validate the minimum proof inputs needed for a demo-safe issuance flow, including `typ=openid4vci-proof+jwt`, issuer audience, issuer-provided nonce freshness, and the holder public key material referenced by the proof.

#### Scenario: Valid proof authorizes issuance
- **WHEN** the credential endpoint receives a credential request with a valid access token and a valid proof JWT for the issuer audience
- **THEN** the issuer verifies the proof `typ`, verifies the proof audience matches the issuer identifier, verifies the proof nonce matches a valid unexpired nonce it issued, extracts the holder public key, and continues credential issuance

#### Scenario: Invalid proof is rejected
- **WHEN** the credential endpoint receives a credential request with a missing, malformed, or audience-mismatched proof JWT
- **THEN** the issuer rejects the request and does not issue a credential

### Requirement: Issuer package exposes nonce freshness for proof JWTs
The `issuer` package MUST expose a nonce endpoint and issue nonce values needed for proof JWT freshness in the supported OpenID4VCI flow.

#### Scenario: Wallet obtains a nonce for proof construction
- **WHEN** a wallet calls the issuer nonce endpoint before credential issuance
- **THEN** the issuer returns a fresh nonce value that the wallet can place into the proof JWT nonce claim

### Requirement: Issuer package exposes signing metadata for verification
The `issuer` package MUST make issuer verification keys available through metadata so that wallets can verify issued `dc+sd-jwt` credentials using standard JWK-based verification.

#### Scenario: Wallet resolves issuer verification key
- **WHEN** a wallet fetches issuer verification metadata for a credential signed by the issuer
- **THEN** it can resolve the signing key from issuer metadata and verify the credential signature using the advertised key material

### Requirement: Issuer package uses Zod-first schema composition for validated inputs
The `issuer` package MUST define runtime-validated protocol and configuration inputs using Zod schemas with inferred TypeScript types where runtime validation is needed. When only compile-time typing is needed, the package MUST use plain TypeScript types. Related schemas and types MUST be composed rather than duplicated.

#### Scenario: Issuer validates external input with composed schemas
- **WHEN** a caller passes issuer configuration, token request data, or credential issuance input into validated package entry points
- **THEN** the package validates those inputs with composed Zod schemas and exposes inferred types from those schemas instead of duplicating runtime and static models

### Requirement: Issuer package uses sd-jwt-js for sd-jwt handling
The `issuer` package MUST prefer the `openwallet-foundation/sd-jwt-js` family of libraries for SD-JWT issuance and disclosure handling instead of implementing SD-JWT primitives from scratch.

#### Scenario: Issuer creates SD-JWT artifacts through library integration
- **WHEN** the package issues a `dc+sd-jwt` credential
- **THEN** the SD-JWT encoding and disclosure handling are produced through the chosen sd-jwt-js library integration rather than custom SD-JWT primitives

### Requirement: Issuer package generates issuer keys and certificates for trust bootstrapping
The `issuer` package MUST provide utilities to generate issuer signing keys and issuer certificate material for local/demo trust configuration.

#### Scenario: Issuer generates trust material
- **WHEN** a caller requests issuer trust material generation
- **THEN** the package returns issuer signing key material plus certificate-oriented or verifier-trust-oriented artifacts that can be configured in external verifiers as trusted
