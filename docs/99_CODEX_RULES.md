# Codex Rules

每次开发前必须先阅读 docs/00_PROJECT_PRINCIPLES.md、docs/98_ARCHITECT_GUARDRAILS.md、docs/99_CODEX_RULES.md。若实现内容与 98_ARCHITECT_GUARDRAILS.md 冲突，必须停止并询问用户，不得自行决定。

## Current Phase

Phase 7: Final Review / Architecture Audit.
Phase 6.5 Risk Explainability has been confirmed complete by the user.
Only document the final architecture audit and next-phase roadmap.
Do not implement BrowserGenerator, complete PersonaGenerator, API Server, CLI, UI, browser environment generation, external browser control, or environment simulation logic.

## Non-Negotiable Rules

- Persona is not a database entity.
- Persona is runtime generated output.
- Generator only generates.
- Validator only validates.
- Importer only converts raw txt into standard JSON.
- Never skip Validator.
- Do not randomly splice environments.
- Do not generate feature descriptions for evading platform safety systems.
- During Phase 1.5, only Importer may read `raw-data`.
- Generator and Validator must not read `raw-data`.
- `database` may contain only structured JSON produced by Importer.
- Every database JSON record must include `source` and `confidence`.
- Importer must generate an ImportReport.
- Importer must report unparseable data as warnings or errors.
- Do not redefine RuntimePersona in any file.
- RuntimePersona must only be imported from `src/types/RuntimePersona.ts`.

## Implementation Rules

- Keep module boundaries explicit.
- Prefer typed contracts before implementation.
- Add Generator business logic only after confirmation.
- Preserve source traceability from raw txt to imported JSON.
- Treat validation failure as blocking unless explicitly classified otherwise.
