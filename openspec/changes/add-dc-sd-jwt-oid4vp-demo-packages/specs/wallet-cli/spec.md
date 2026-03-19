## ADDED Requirements

### Requirement: Wallet CLI package exposes wallet-only flows through validated commands
The `wallet-cli` package MUST consume the `wallet` package and expose wallet-only commands for storing credentials, inspecting wallet contents, and generating OpenID4VP presentations. The package MUST NOT implement local verifier behavior. Every command input MUST be validated with Zod schemas before the CLI calls wallet package APIs. The CLI MUST expose at least `import`, `list`, `show`, and `present` commands.

#### Scenario: Operator imports a credential into file-backed wallet storage
- **WHEN** a user runs the wallet CLI import command with valid credential input and storage location options
- **THEN** the CLI validates the inputs with Zod and stores the credential through the `wallet` package using the configured file-backed storage implementation

#### Scenario: Wallet CLI excludes verifier behavior
- **WHEN** a user inspects wallet CLI commands
- **THEN** the CLI exposes wallet commands only and does not include request validation or local verifier response-processing commands

### Requirement: Wallet CLI package stores credentials as separate files
The `wallet-cli` package MUST use a filesystem-backed storage implementation of the `wallet` storage abstraction that persists credentials as separate files. The CLI MUST also persist any required wallet metadata and holder keys needed to reopen the wallet state across runs.

#### Scenario: Imported credentials are persisted as separate files
- **WHEN** a user imports multiple credentials through the wallet CLI
- **THEN** the underlying storage writes each credential to a separate file and preserves the metadata needed to reload them later

#### Scenario: Wallet state survives restart
- **WHEN** a user closes and reruns the wallet CLI against the same storage directory
- **THEN** the CLI can list previously stored credentials and use them for presentation generation

### Requirement: Wallet CLI package defines detailed command options
The `wallet-cli` package MUST provide detailed, documented command options for import, list, show, and present flows. The present flow MUST support only DCQL-based OpenID4VP input and MUST reject Presentation Exchange inputs.

#### Scenario: Import command options are available
- **WHEN** a user runs wallet CLI help for the import command
- **THEN** the CLI documents options including `--wallet-dir`, `--credential-file` or `--credential`, `--issuer`, `--issuer-metadata`, and `--output json|pretty`

#### Scenario: List command options are available
- **WHEN** a user runs wallet CLI help for the list command
- **THEN** the CLI documents options including `--wallet-dir`, `--vct`, `--issuer`, and `--output json|pretty`

#### Scenario: Show command options are available
- **WHEN** a user runs wallet CLI help for the show command
- **THEN** the CLI documents options including `--wallet-dir`, `--credential-id`, and `--output json|pretty|raw`

#### Scenario: Present command options are available
- **WHEN** a user runs wallet CLI help for the present command
- **THEN** the CLI documents options including `--wallet-dir`, `--request-file` or `--request`, `--credential-id` if manual selection override is supported, and `--output json|pretty|raw`

#### Scenario: Presentation Exchange input is rejected
- **WHEN** a user runs the present command with Presentation Exchange input instead of DCQL-based OpenID4VP input
- **THEN** the CLI rejects the input during validation and reports that only DCQL is supported
