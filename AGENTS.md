## Purpose

- Prefer repo conventions over generic framework advice.

## Required Tooling

- Use `bun` as the runtime, package manager, script runner, and test runner.
- Do not use `npm`, `pnpm`, or `yarn` in this repository.
- The repo is a Bun workspace monorepo managed with Turbo.
- Formatting and linting are handled by Biome.

## Repo Layout

- `packages/wallet`: core wallet library.
- `packages/issuer`: core issuer library.
- `packages/cli-common`: shared CLI helpers.
- `packages/wallet-cli`: wallet command-line app.
- `packages/issuer-cli`: issuer command-line app.
- `packages/issuer-web-server`: Hono-based issuer web API/server.
- `packages/issuer-web-client`: React + Vite frontend.
- `packages/issuer-web-shared`: shared web schemas/types.

## Install And Setup

- Install dependencies with `bun install`.
- Use workspace filters when targeting one package.
- Expect local `.env` files to affect Turbo cache and app behavior.

## Top-Level Commands

- Build all packages: `bun run build`
- Typecheck all packages: `bun run check-types`
- Test all packages: `bun run test`
- Lint and format all files: `bun run lint`
- Run issuer web stack: `bun run dev:issuer-web`
- Run issuer web client only: `bun run dev:issuer-web-client`
- Run issuer web server only: `bun run dev:issuer-web-server`
- Run demo e2e flow: `bun run demo:e2e`
- Run demo OID4VCI flow: `bun run demo:oid4vci`

## Package-Level Commands

- Build one package: `bun --filter '@vidos-id/openid4vc-wallet' run build`
- Typecheck one package: `bun --filter '@vidos-id/openid4vc-wallet' run check-types`
- Test one package: `bun --filter '@vidos-id/openid4vc-wallet' run test`
- Start one package dev task: `bun --filter '@vidos-id/openid4vc-issuer-web-client' run dev`

## Single-Test Commands

- Run one test file in a workspace context: `bun --filter '@vidos-id/openid4vc-wallet' test src/wallet.test.ts`
- Run one named test: `bun test packages/issuer/src/issuer.test.ts --test-name-pattern 'creates status list'`
- Run one named test in a package: `bun --filter '@vidos-id/openid4vc-issuer' test src/issuer.test.ts --test-name-pattern 'proof'`
- Turbo is appropriate for full-package or full-repo test runs, not targeted single tests.

## Package Build Notes

- `wallet`, `issuer`, and `cli-common` build via `tsc --noEmit`.
- `wallet-cli` and `issuer-cli` build with `bun build` into `dist/`.
- `issuer-web-client` build uses `vite build`.
- `issuer-web-server` has a DB helper command: `bun --filter '@vidos-id/openid4vc-issuer-web-server' run db:generate`.

## Formatting And Linting

- Biome is the source of truth for formatting and linting.
- Indentation uses tabs.
- JavaScript/TypeScript string quotes use double quotes.
- The repo-level lint script is `biome check --write .`, so it both checks and rewrites files.
- After non-trivial edits, run at least `bun run lint` and the narrowest relevant tests.

## TypeScript Conventions

- Keep `strict` TypeScript compatibility.
- Prefer explicit exported types for public APIs.
- Use `import type` for type-only imports.
- Prefer `type` aliases unless an `interface` is clearly more suitable.
- Preserve `.ts` and `.tsx` import extensions in local imports.
- Do not weaken types with `any` unless there is no practical alternative.
- Prefer `unknown` over `any` when validating external input.
- Validate untrusted data at boundaries with Zod schemas when the package already follows that pattern.

## Imports

- Keep type-only imports separated using `import type`.
- Prefer relative local imports within a package.
- Keep shared package imports using workspace package names, not deep relative paths across packages.
- Do not introduce unused imports; Biome will usually clean them up.

## Naming

- Use `camelCase` for variables, functions, and local helpers.
- Use `PascalCase` for React components, classes, and exported types.
- Use `SCREAMING_SNAKE_CASE` for true constants and label maps.
- Match existing domain terminology: `issuance`, `statusList`, `holderKey`, `proofJwt`, `credential`, `wallet`.

## Code Structure

- Prefer small, local helpers over broad abstractions.
- Keep changes minimal and in the existing style of the package you touch.
- In React code, follow the existing function-component style.
- In server code, keep route validation at the request boundary.
- In CLI code, keep parsing and command wiring straightforward and explicit.

## Error Handling

- Throw typed domain errors when a package already defines them, for example `WalletError`, `IssuerError`, or `HTTPException` helpers.
- In Hono handlers, prefer HTTP-specific error helpers for expected client errors.
- For unexpected failures, let the app-level error handler format the response.
- Include actionable error messages.
- When parsing external input, fail early and close to the boundary.

## Testing Conventions

- Tests are run with Bun's test runner using `bun:test`.
- Existing test files live next to source files and use `*.test.ts` or `*.test.tsx`.
- Prefer adding narrow unit tests near the changed code.
- For React tests in this repo, existing coverage uses `renderToString` and string assertions.
- If a change affects one package, run that package's tests first before broader verification.

## Framework Notes

- Server routes use Hono.
- Web input validation commonly uses Zod and `@hono/zod-validator`.
- Frontend uses React 19 with Vite.
- Routing in the web client uses `@tanstack/react-router`.
- Shared schema packages should remain the source of truth for cross-package payload types.

## Agent Workflow

- Read the relevant package files before editing.
- If you touch formatting-sensitive files, run `bun run lint`.
- If you touch types or public contracts, run `bun run check-types` or the package-scoped equivalent.
- If you touch tests, run the affected test file directly first.
- Do not change package managers, build tools, or formatting conventions unless explicitly asked.

## Safety

- Do not commit secrets, tokens, or `.env` values.
- Treat local environment configuration as user-owned.
- Avoid destructive cleanup of generated files unless the task requires it.
- Respect unrelated user changes in the worktree.

## Good Defaults

- Start with package-scoped commands before repo-wide commands.
- Prefer direct `bun test <path>` for a single test file.
- Prefer `bun --filter '<package>' run <script>` when validating one workspace package.
- Prefer schema validation and strict typing over implicit assumptions.
- Prefer small patches that preserve existing naming and structure.
