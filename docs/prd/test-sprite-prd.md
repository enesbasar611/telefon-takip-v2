# Test Sprite PRD

## Overview

Test Sprite is a lightweight testing companion for the Basar Teknik V2 application. Its purpose is to help the team define, run, and review focused regression checks around high-risk workflows such as finance, stock, service intake, courier tasks, and dashboard cache behavior.

## Problem

Recent work has touched several interconnected areas: React Query caching, finance transactions, receivables, courier flows, service forms, and dashboard widgets. Manual verification is useful, but repeated checks are easy to miss and difficult to standardize. The project needs a small, repeatable test layer that captures expected behavior before and after changes.

## Goals

- Provide a clear checklist-driven testing surface for critical business flows.
- Make regression checks easy to run locally before build or deploy.
- Keep tests focused, readable, and close to real user behavior.
- Support future expansion without forcing a large testing framework rewrite.

## Non-Goals

- Replace full QA or browser-based end-to-end coverage.
- Test every UI state in the application.
- Add brittle snapshot-heavy tests.
- Introduce production behavior changes only for tests.

## Target Users

- Developers making changes in finance, stock, service, courier, and dashboard modules.
- Project owner reviewing whether key business flows still work.
- Future maintainers who need quick confidence before shipping.

## Core Requirements

1. Test definitions should be grouped by domain: finance, stock, service, courier, dashboard.
2. Each test should describe the business behavior it protects.
3. Tests should be runnable with existing project tooling, preferably `ts-node` for lightweight logic checks.
4. Tests should fail with clear messages that explain what behavior broke.
5. Test Sprite should include a short runbook for adding new regression cases.

## Initial Test Coverage

- Finance transaction search filters customer, supplier, user, account, description, and category fields.
- Finance transaction currency selection resolves saved preference before shop default currency.
- Currency conversion shows TL, USD, and EUR equivalents using current rates.
- Kasa account selection receives active finance accounts and displays account names consistently.
- Dashboard cache invalidation remains connected after finance mutations.

## User Stories

- As a developer, I want to run a small test command before finishing a finance change, so I know core cash-flow behavior still works.
- As a maintainer, I want each test to explain the business rule it protects, so failures are easier to understand.
- As the project owner, I want new risky fixes to leave behind regression coverage, so the same bug does not return quietly.

## Success Metrics

- New critical bug fixes include at least one focused regression test.
- Test failures point to a specific business behavior.
- Local regression checks complete quickly enough to run during normal development.
- Finance and dashboard changes no longer rely only on visual/manual checks.

## Open Questions

- Should Test Sprite remain a lightweight local test convention, or become a visible in-app QA panel later?
- Should browser tests be added for modal layout and theme behavior after core logic coverage is stable?
- Which production workflows should be considered mandatory pre-deploy checks?

## Milestones

1. Create the PRD and initial test taxonomy.
2. Add helper-level regression tests for finance search and currency behavior.
3. Document the command pattern for running Test Sprite checks.
4. Expand coverage to service intake and courier task transitions.
5. Review whether browser-level smoke tests are needed for visual regressions.

