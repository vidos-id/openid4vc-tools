## ADDED Requirements

### Requirement: Wallet package receives credentials directly from an OID4VCI credential offer
The `wallet` package MUST support direct credential receipt through a minimal OID4VCI pre-authorized-code flow. The wallet MUST be able to resolve a supported credential offer, fetch issuer metadata, exchange the pre-authorized code for an access token, obtain or use a nonce for proof creation, request a `dc+sd-jwt` credential, and store the resulting credential.

#### Scenario: Wallet completes direct issuance from an offer
- **WHEN** a caller asks the wallet package to receive a credential from a valid supported offer
- **THEN** the wallet resolves the offer, completes the OID4VCI flow against the issuer endpoints, imports the returned credential, and returns the stored credential record

### Requirement: Wallet package parses supported credential offer formats
The `wallet` package MUST parse supported OID4VCI offer inputs including by-value offer JSON and `openid-credential-offer://` URIs carrying by-value offers.

#### Scenario: Wallet parses a credential-offer URI
- **WHEN** the wallet receives an `openid-credential-offer://` URI containing a supported by-value offer
- **THEN** the wallet extracts and validates the credential offer fields needed to continue the issuance flow

#### Scenario: Wallet rejects unsupported offer shape
- **WHEN** the wallet receives an invalid or unsupported credential offer input
- **THEN** the wallet rejects the input before making issuance requests

### Requirement: Wallet package uses the existing holder key for OID4VCI proofs
The `wallet` package MUST use the wallet holder key to build `openid4vci-proof+jwt` proofs for direct issuance. The proof MUST bind the request to the issuer audience and issuer nonce and MUST carry the holder public JWK needed for cryptographic binding of the issued credential.

#### Scenario: Wallet creates a valid issuance proof
- **WHEN** the wallet prepares a credential request for holder-bound issuance
- **THEN** it creates a proof JWT signed with the holder private key and containing the issuer audience, the issuer nonce, and the corresponding holder public key information

### Requirement: Wallet package reuses credential import validation after issuance
The `wallet` package MUST validate and store directly issued credentials through the existing credential import path rather than using a separate persistence path for OID4VCI results.

#### Scenario: Directly issued credential is validated before storage
- **WHEN** the issuer returns a credential through the wallet OID4VCI client flow
- **THEN** the wallet validates issuer metadata and credential structure through its normal import behavior before persisting the credential

### Requirement: Wallet package keeps the direct issuance profile intentionally small
The `wallet` package MUST limit this capability to a pragmatic subset covering `dc+sd-jwt`, a single credential request, JWT proof type, and direct import. The wallet MUST NOT require or implement authorization-code flow, DPoP, wallet attestation, key attestation, `tx_code`, deferred issuance, encrypted credential responses, or batch issuance in this capability.

#### Scenario: Unsupported advanced issuance feature is rejected or omitted
- **WHEN** a caller attempts to use a direct issuance feature outside the supported subset
- **THEN** the wallet package rejects the input or documents the feature as unsupported rather than partially implementing it
