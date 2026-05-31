# Project Principles

## Phase 1 Boundary

This phase creates project structure, documentation, and TypeScript type drafts only.
No complete business logic is implemented before explicit confirmation.

## Core Rules

- Persona is not a database entity.
- Persona is a runtime generated result.
- Generator only generates.
- Validator only validates.
- Importer only converts raw txt files into standard JSON.
- Validator must never be skipped.
- Environments must not be randomly spliced.
- The project must not generate feature descriptions intended to evade platform safety systems.

## Responsibility Separation

Importer, Generator, and Validator are independent roles with clear inputs and outputs.
Each role may depend on typed contracts, but must not absorb another role's responsibility.

## Data Integrity

Raw source files remain traceable.
Imported JSON must preserve source metadata.
Validated data must record validation status and validation issues.

