## ADDED Requirements

### Requirement: Wallet CLI exposes direct OID4VCI receipt as a separate command
The `wallet-cli` package MUST expose a separate command for direct OID4VCI receipt from a credential offer. This command MUST consume the wallet package OID4VCI client flow and MUST remain distinct from the existing credential import command.

#### Scenario: User receives a credential from an offer
- **WHEN** a user runs the wallet CLI direct receipt command with a valid wallet directory and credential offer input
- **THEN** the CLI validates the inputs, executes the wallet package OID4VCI flow, and reports the stored credential result

### Requirement: Wallet CLI accepts supported offer input forms
The direct receipt command MUST accept a credential offer as either inline JSON or an `openid-credential-offer://` URI.

#### Scenario: User passes an offer URI
- **WHEN** a user invokes the direct receipt command with an `openid-credential-offer://` URI
- **THEN** the CLI passes the offer to the wallet package for parsing and direct issuance

#### Scenario: User passes inline offer JSON
- **WHEN** a user invokes the direct receipt command with inline credential-offer JSON
- **THEN** the CLI validates and passes the JSON offer to the wallet package for direct issuance

### Requirement: Wallet CLI leaves manual credential import unchanged
The `wallet-cli import` command MUST continue handling already-issued credential blobs only and MUST NOT silently switch to direct OID4VCI receipt behavior.

#### Scenario: Manual import behavior remains separate
- **WHEN** a user runs the existing import command
- **THEN** the command continues to import a provided credential blob without attempting to interpret the input as a credential offer
