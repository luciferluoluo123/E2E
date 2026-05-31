# Validation Standard

## Purpose

Validation is the mandatory gate between imported data, generated runtime output, and accepted use.

## Validation Targets

- Imported standard JSON
- Generator input context
- Runtime Persona output
- Environment references
- Safety policy compliance

## Blocking Conditions

Validation must fail when:

- Required fields are missing.
- Source metadata is absent.
- Persona is modeled as a persisted database entity.
- Generator output bypasses Validator.
- Environment fields are randomly combined or untraceable.
- Content describes features intended to evade platform safety systems.
- A module performs responsibilities outside its boundary.

## Result Shape

Validation results should include:

- `ok`
- `severity`
- `issues`
- `checkedAt`
- `validatorVersion`

## Severity Draft

- `info`: Non-blocking note.
- `warning`: Needs review but may not block.
- `error`: Blocks acceptance.
- `critical`: Blocks acceptance and indicates architectural or safety violation.

