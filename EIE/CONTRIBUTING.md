# Contributing

Thank you for considering a contribution to E2E.

This project is an infrastructure framework for browser environment modeling, rule validation, runtime persona assembly, and risk analysis. Contributions should preserve the existing architecture boundaries and documented guardrails.

## Development Workflow

1. Read the project documentation before making changes:
   * `docs/00_PROJECT_PRINCIPLES.md`
   * `docs/98_ARCHITECT_GUARDRAILS.md`
   * `docs/99_CODEX_RULES.md`
2. Install dependencies:

```bash
npm install
```

3. Run validation before opening a pull request:

```bash
npm run typecheck
npm test
```

## Branch Strategy

Use short, descriptive branch names:

```text
feature/browser-rule-expansion
fix/database-validation-report
docs/roadmap-update
```

Keep each branch focused on one change area.

## Pull Request Rules

Pull requests should include:

* A clear summary of the change.
* Tests for behavior changes.
* Documentation updates for architecture, rules, or public workflows.
* Confirmation that `npm run typecheck` passes.
* Confirmation that `npm test` passes.

Do not combine unrelated refactors with feature or documentation changes.

## Coding Standards

* TypeScript strict mode must remain enabled.
* Unit tests are required for new logic.
* RuntimePersona must only be imported from `src/types/RuntimePersona.ts`.
* Do not redefine RuntimePersona in any other file.
* Keep Generator, Validator, RiskEngine, and Explainer responsibilities separate.
* Do not read `raw-data` outside Importer code.
* Do not store RuntimePersona in `database`.

## Documentation Standards

Documentation is required when a change affects:

* Architecture boundaries
* Versioning policy
* Rule seed semantics
* Validation behavior
* Public project workflow
* Contributor expectations

Write documentation in clear, direct language and keep examples aligned with existing project terminology.
