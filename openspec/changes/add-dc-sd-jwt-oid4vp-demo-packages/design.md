## Context

This change introduces four related packages: `issuer`, `wallet`, `issuer-cli`, and `wallet-cli`. The goal is to prove a complete demo flow for issuing `application/dc+sd-jwt` credentials with OpenID4VCI and presenting them with OpenID4VP using cryptographic holder binding, while keeping the implementation intentionally narrow and easy to understand.

The referenced specs are broad frameworks with many optional branches. For this repo, the design needs a constrained profile that is realistic enough to interoperate in a demo, but small enough to implement quickly with Bun, TypeScript, Commander, Zod, Jose, focused helpers from `openwallet-foundation/sd-jwt-js`, and `dcql-ts` for DCQL processing.

## Goals / Non-Goals

**Goals:**
- Provide a minimal `issuer` package that can publish simple metadata, mint pre-authorized issuance grants, validate wallet proof JWTs, and issue holder-bound `dc+sd-jwt` credentials from caller-provided claim sets.
- Provide a minimal `wallet` package that can generate and store a holder key through a storage abstraction, receive issued credentials, match simple OpenID4VP DCQL requests, and produce `dc+sd-jwt` presentations with KB-JWT holder binding.
- Keep issuer and wallet concerns separate so the two utility packages can be consumed independently and through separate CLI packages.
- Define a narrow profile around one credential format (`dc+sd-jwt`), one proof style (`jwt`), one signing family for examples/tests, and simple local/demo storage.
- Require lightweight automated tests for the key protocol and storage behaviors.
- Prefer Zod schemas with inferred types whenever runtime validation is needed, and plain TypeScript types only when runtime validation is unnecessary.

**Non-Goals:**
- Full spec coverage for OpenID4VCI, OpenID4VP, SD-JWT VC, or all credential format variants.
- Production-hardening features such as federation, attestation frameworks, revocation/status checking, encrypted responses, advanced verifier validation, multi-tenant isolation, or enterprise deployment patterns.
- Support for W3C VC, mdoc, deferred issuance, batch issuance, transaction data, request URI POST, Digital Credentials API, broad wallet UX flows, or Presentation Exchange.

## Decisions

### Decision: Implement a strict demo protocol profile
- The issuer and wallet SHALL support only `dc+sd-jwt` credentials.
- OpenID4VCI SHALL use the pre-authorized code flow as the default and only supported issuance flow in the first version.
- The minimal issuer implementation SHALL include the token endpoint behavior needed by that pre-authorized code flow.
- The profile SHALL support a minimal issuer-initiated credential offer because it is the normal entry point for pre-authorized issuance demos.
- The profile SHALL keep optional `tx_code` support out of scope.
- The profile SHALL keep batch issuance out of scope.
- OpenID4VP SHALL use `response_type=vp_token` with a simple by-value request for same-device/demo usage.
- OpenID4VP authorization requests in the supported profile SHALL require `dcql_query` directly and SHALL not support `scope`-encoded queries.
- OpenID4VP request matching SHALL support only DCQL and SHALL not implement Presentation Exchange.
- Holder binding SHALL be implemented with `cnf` in the credential and KB-JWT at presentation time.
- KB-JWTs SHALL use `typ=kb+jwt` and include `nonce`, `aud`, and `sd_hash`.
- OpenID4VCI proof JWTs SHALL use `typ=openid4vci-proof+jwt` and include issuer audience and issuer-provided nonce freshness values.
- Rationale: this is the smallest profile that still demonstrates the full issuer-holder-verifier lifecycle.
- Alternatives considered: implementing authorization code flow and request URI support now. Rejected because they add browser/front-channel complexity with little demo value.

### Decision: Split utilities from CLIs into four packages
- The workspace packages will be named `issuer`, `wallet`, `issuer-cli`, and `wallet-cli`.
- `issuer` will expose issuer APIs.
- `wallet` will expose wallet APIs.
- `issuer-cli` will wrap issuer behaviors.
- `wallet-cli` will wrap wallet behaviors only.
- Rationale: the user asked for separate packages/modules for issuer and wallet implementations and separate packages that consume them via CLIs. This also keeps library APIs usable from tests or custom scripts.
- Alternatives considered: a single monolithic package or CLIs embedded directly in the utility packages. Rejected because it blurs boundaries and makes reuse/testing less clean.

### Decision: Accept claim sets directly at issuance time
- The `issuer` package SHALL accept a caller-provided claim set as issuance input.
- Credential issuance SHALL preserve those claims subject to issuer-side validation and SD-JWT disclosure rules.
- Credential requests in the supported profile SHALL identify the requested type by `credential_configuration_id`; the more complex `credential_identifiers` path stays out of scope.
- Rationale: the goal is a reusable utility that can issue arbitrary demo datasets without hardcoding all claim values into credential configurations.
- Alternatives considered: issuing only static fixture claims or requiring a custom schema per credential type. Rejected because they reduce demo flexibility.

### Decision: Generate issuer trust material in `issuer`
- The `issuer` package SHALL provide utilities to generate issuer signing keys and issuer certificates suitable for local/demo trust bootstrapping.
- The issuer package and CLI SHALL emit trust artifacts that external verifiers can configure as trusted.
- The initial implementation SHALL use JWK/JWKS-oriented verification for wallets and presentation handling, while certificate artifacts remain verifier-facing trust material only.
- Rationale: demo environments need a simple way to bootstrap issuer trust without external PKI setup.
- Alternatives considered: requiring users to bring their own issuer key/certificate material only. Rejected because it adds friction to demos.

### Decision: Put storage abstraction in `wallet`, file storage in `wallet-cli`
- The `wallet` package SHALL define a storage abstraction or equivalent persistence boundary.
- The abstraction SHALL cover wallet-generated holder keys, credentials, and minimal indexes for lookup by `vct`, issuer, and local credential id.
- `wallet-cli` SHALL provide a filesystem-backed implementation that stores credentials as separate files.
- Rationale: the package stays reusable while the CLI gets the pragmatic local filesystem behavior requested by the user.
- Alternatives considered: file storage embedded directly in `wallet` or in-memory-only storage. Rejected because they either reduce reuse or reduce CLI practicality.

### Decision: Keep credential metadata and query matching intentionally small
- The issuer SHALL expose one or a few static credential configurations.
- The wallet SHALL support a reduced DCQL subset focused on `format`, `meta.vct_values`, and requested claim paths.
- The wallet SHALL support claim disclosure selection only from its stored SD-JWT disclosures and SHALL not implement advanced query combinators in the first version.
- The wallet SHALL not implement Presentation Exchange parsing or mapping.
- The wallet SHALL use `dcql-ts` for parsing and handling DCQL inputs where the library covers the supported subset.
- Rationale: a narrow DCQL subset is enough to demo selective disclosure without implementing the full query model.
- Alternatives considered: support for `scope`, credential sets, trusted authorities, Presentation Exchange, or complex claim set logic. Rejected for initial scope.

### Decision: Reuse established libraries for crypto and protocol shaping
- `jose` SHALL be used for JWK/JWT handling and signing.
- `zod` SHALL validate external inputs, metadata, offers, requests, and stored JSON structures.
- SD-JWT issuance, parsing, and disclosure handling SHALL prefer `openwallet-foundation/sd-jwt-js` packages instead of hand-rolling the format.
- Rationale: the request explicitly prefers libraries over reinventing the wheel and the change is crypto-heavy.
- Alternatives considered: custom SD-JWT and JOSE primitives. Rejected as error-prone and unnecessary.

### Decision: Use Zod-first schema/type modeling
- Any external, persisted, or CLI-supplied data that needs runtime validation SHALL be modeled with Zod schemas and TypeScript types inferred from those schemas.
- Pure internal compile-time-only structures MAY use plain TypeScript types.
- Schemas and types SHALL be composed and reused instead of duplicating near-identical definitions.
- Rationale: this keeps validation centralized and aligns CLI, package, and persistence models.
- Alternatives considered: separate hand-written TS interfaces plus ad hoc validation. Rejected because it increases duplication and drift.

### Decision: Keep `wallet-cli` strictly wallet-only
- `wallet-cli` SHALL not embed a local verifier or verifier-like response validation workflow.
- The CLI scope ends at storing credentials, inspecting them, and generating presentation payloads from wallet-held material.
- The wallet SHALL do only minimal presentation-request validation needed to safely construct a presentation in the supported profile and SHALL not maintain a trusted-verifier or trusted-reader store.
- Rationale: verifier behavior is explicitly out of scope.
- Alternatives considered: bundling a local verifier helper to ease demos. Rejected by requested scope.

### Decision: Validate the minimum interoperable security checks, no more
- The wallet SHALL verify issuer signatures using a simple JWKS/JWKS metadata path.
- The issuer SHALL expose a nonce endpoint for proof freshness, SHALL require proof JWTs for holder-bound issuance, and SHALL bind the credential `cnf` to the holder key from the validated proof.
- The wallet SHALL generate and persist its holder key, SHALL validate `nonce`, `aud`, and key binding inputs needed for KB-JWT construction, and SHALL serialize holder-bound presentations as `SD-JWT~KB-JWT`.
- Rationale: these checks are the minimum needed to honestly claim holder-bound demo flows.
- Alternatives considered: skipping proof validation entirely for simplicity. Rejected because it would undermine the core holder-binding goal.

## Risks / Trade-offs

- [Reduced interoperability] -> Mitigate by documenting the supported OpenID4VCI/OpenID4VP/DCQL subset explicitly in specs and CLI help.
- [Spec drift as drafts evolve] -> Mitigate by naming the exact references and constraining implementation to today's chosen identifiers such as `dc+sd-jwt` and current proof fields.
- [Filesystem wallet storage is not secure at rest] -> Mitigate by keeping it in `wallet-cli`, marking it as internal/demo-only, and avoiding claims of production readiness.
- [Crypto/library integration complexity] -> Mitigate with unit tests around proof JWTs, SD-JWT issuance, disclosure selection, and KB-JWT creation.
- [CLI-first flows may hide protocol boundaries] -> Mitigate by keeping package APIs explicit and mapping each CLI action to clear protocol steps.
- [Schema sprawl and duplication] -> Mitigate by enforcing Zod-first composition and shared schema modules.

## Migration Plan

- No existing production behavior is being migrated.
- Add the new packages and wire workspace scripts for build, test, and local execution.
- Introduce static demo configuration and sample credential types for tests and CLI examples.
- Add the wallet filesystem adapter only in `wallet-cli`, keeping `wallet` storage pluggable.
- Rollback is limited to removing the added packages and scripts if the approach proves unsuitable.

## Open Questions

- Which exact `@sd-jwt/*` packages from `openwallet-foundation/sd-jwt-js` best fit Bun and the desired feature set.
- Whether file-backed wallet storage should use one manifest file plus per-credential files, or fully derive indexes from the credential files on load.
