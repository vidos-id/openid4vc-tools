## 1. Issuer package OID4VCI surface

- [x] 1.1 Add Zod schemas and exported types for supported credential offers, credential-offer URIs, issuer metadata, token requests, and credential requests/responses in `packages/issuer`
- [x] 1.2 Add server-oriented issuer helpers for OID4VCI metadata, by-value offer creation, and `openid-credential-offer://` URI serialization
- [x] 1.3 Extend issuer metadata generation to include the supported `scope` value for each credential configuration in the direct issuance profile
- [x] 1.4 Export the new issuer OID4VCI helpers from `packages/issuer/src/index.ts` and document their storage-agnostic usage for embedded server applications

## 2. Wallet package OID4VCI client flow

- [x] 2.1 Add a dedicated `openid4vci` wallet module for parsing supported offer inputs and fetching issuer metadata
- [x] 2.2 Implement wallet-side pre-authorized-code token exchange, nonce retrieval, proof JWT creation, and credential request submission using the existing holder key
- [x] 2.3 Reuse the existing wallet credential import flow to validate and store directly issued credentials from the OID4VCI client module
- [x] 2.4 Export the new wallet OID4VCI APIs from `packages/wallet/src/index.ts`

## 3. Wallet CLI direct issuance

- [x] 3.1 Add a new `wallet-cli` command for direct receipt from a credential offer with validated options for wallet directory and offer input
- [x] 3.2 Implement the CLI action that invokes the wallet package OID4VCI flow and reports the stored credential result
- [x] 3.3 Keep the existing `wallet-cli import` command behavior unchanged for already-issued credential blobs only

## 4. Tests and documentation

- [x] 4.1 Add issuer package tests covering metadata shaping, by-value credential offers, and credential-offer URI serialization
- [x] 4.2 Add wallet package tests covering offer parsing, mocked OID4VCI network flow, proof creation, and direct credential storage
- [x] 4.3 Add wallet-cli tests covering the new direct receipt command and preserving import command behavior
- [x] 4.4 Update repo and package documentation to describe the supported minimal OID4VCI subset, direct offer-based issuance flow, and explicit out-of-scope features
