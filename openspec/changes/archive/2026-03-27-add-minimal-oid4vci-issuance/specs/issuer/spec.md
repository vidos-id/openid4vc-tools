## ADDED Requirements

### Requirement: Issuer package exposes server-oriented minimal OID4VCI primitives
The `issuer` package MUST expose a minimal OID4VCI surface suitable for embedding into a separate server application. The package MUST provide issuer metadata and request/response helpers for a pre-authorized-code issuance flow without owning HTTP routing or persistence.

#### Scenario: Server application publishes issuer metadata
- **WHEN** a host application asks the issuer package for OID4VCI metadata
- **THEN** the package returns credential issuer metadata containing the credential issuer identifier, token endpoint, credential endpoint, nonce endpoint when holder binding is supported, and `credential_configurations_supported` for `dc+sd-jwt`

#### Scenario: Server application uses external persistence
- **WHEN** a host application exchanges a pre-authorized code or validates a nonce through the issuer package
- **THEN** the package returns updated grant, token, or nonce records for the host application to persist instead of storing them internally

### Requirement: Issuer package supports minimal credential-offer transport for direct issuance
The `issuer` package MUST support a minimal OID4VCI credential-offer flow for direct wallet issuance. The supported flow MUST include by-value offers and MUST be able to produce an `openid-credential-offer://` URI carrying a by-value offer.

#### Scenario: Issuer creates a by-value credential offer
- **WHEN** a caller creates a credential offer for a supported credential configuration
- **THEN** the issuer returns an offer containing `credential_issuer`, the requested `credential_configuration_ids`, and the pre-authorized-code grant needed for wallet receipt

#### Scenario: Issuer creates a credential-offer URI
- **WHEN** a caller asks the issuer package to serialize a supported by-value offer for wallet invocation
- **THEN** the package returns an `openid-credential-offer://` URI containing the credential offer in a form the wallet package can parse

### Requirement: Issuer package advertises a narrow HAIP-aligned metadata subset
The `issuer` package MUST publish a narrow metadata subset aligned with the repo's direct issuance profile. Each supported credential configuration MUST identify `format=dc+sd-jwt`, `vct`, proof signing algorithms, credential signing algorithms, and a `scope` value.

#### Scenario: Wallet discovers issuer configuration details
- **WHEN** a wallet fetches issuer metadata before starting issuance
- **THEN** each supported credential configuration includes `format`, `vct`, `scope`, proof-type metadata for JWT proofs, and credential signing algorithm metadata

### Requirement: Issuer package keeps advanced OID4VCI features out of scope
The `issuer` package MUST keep the supported direct issuance profile limited to pre-authorized-code issuance of a single `dc+sd-jwt` credential. The package MUST NOT require or implement authorization-code flow, DPoP, wallet attestation, key attestation, `tx_code`, deferred issuance, encrypted credential responses, or batch issuance in this capability.

#### Scenario: Unsupported advanced flow is rejected or omitted
- **WHEN** a caller attempts to use an advanced OID4VCI or HAIP feature outside the supported profile
- **THEN** the issuer package rejects the input or documents the feature as unsupported rather than partially implementing it
