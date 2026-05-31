# Architecture

## Modules

### raw-data

Stores original source material, especially unmodified txt inputs.
This directory is append-only from the perspective of the pipeline.

### Importer

Converts raw txt input into standard JSON.
Importer does not validate semantic correctness beyond basic parseability required for conversion.
Importer does not generate personas.

### database

Stores structured JSON, schemas, validation outputs, and export-ready data.
Database content represents persisted source, imported, or validated artifacts.
Persona is excluded because it is generated at runtime.

### Generator

Consumes validated data and generation context.
Generator returns runtime Persona output only.
Generator does not validate and does not import raw txt.

### Validator

Checks imported or generated structures against project rules.
Validator returns validation results, issues, and blocking status.
Validator does not generate data and does not import raw txt.

## Required Flow

```text
raw-data/*.txt
  -> Importer
  -> standard JSON
  -> Validator
  -> validated JSON
  -> Generator
  -> runtime Persona
  -> Validator
  -> accepted runtime result
```

## Architectural Constraints

- Every Generator output must pass Validator before use.
- Persona must not be persisted as a database entity.
- Runtime context must be selected from explicit, validated inputs.
- Environment composition must be deterministic and traceable.
- Safety-evasion descriptions are out of scope and prohibited.

