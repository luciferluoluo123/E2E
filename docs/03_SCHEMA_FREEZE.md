# Phase 2.5 - Schema Freeze

## Status

Phase 2 Raw Data Importer is confirmed complete.
This document freezes schema contracts before any Database Validation, Generator, Validator, or RiskEngine work begins.

## Hard Boundary

Do not enter:

* Phase 3 Database Validation
* Phase 4 Generator
* Phase 5 Validator
* Phase 6 RiskEngine

No Generator, Persona generation logic, Validator implementation, RiskEngine implementation, browser environment generation, hardware randomization, or environment simulation logic is allowed in this phase.

## Database File Envelope

Every database JSON file must use a versioned envelope:

```ts
interface DatabaseFile<TRecord extends TraceableRecord> {
  databaseVersion: string;
  ruleVersion: string;
  collection: DatabaseCollection;
  generatedBy: 'Importer';
  generatedAt: string;
  records: TRecord[];
}
```

## Shared Record Fields

Every record inside `records` must include:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `source` | `string` | yes | Raw data file path used by Importer. |
| `confidence` | `number` | yes | Importer confidence score from `0` to `1`. |
| `ruleVersion` | `string` | yes | Rule/schema version used while importing or generating. |
| `databaseVersion` | `string` | yes | Database snapshot version the record belongs to. |

## Schema Fields

### database/country/countries.json

Collection: `country`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `countryCode` | `string` | yes | Uppercase ISO-like country code. |
| `countryName` | `string` | yes | Country display name from source. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/locale/country-languages.json

Collection: `countryLanguages`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `countryCode` | `string` | yes | Uppercase country code. |
| `languages` | `LanguageRecord[]` | yes | Languages associated with the country. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Lowest confidence of nested language records. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

`LanguageRecord` fields:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `code` | `string` | yes | Normalized locale code. |
| `prefix` | `string` | yes | Lowercase language prefix. |
| `englishName` | `string` | yes | English language name from source when available. |
| `localName` | `string` | yes | Local language name from source when available. |
| `weight` | `number` | yes | Relative selection weight for future engines. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/locale/ui-languages.json

Collection: `uiLanguages`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `code` | `string` | yes | Normalized UI language code. |
| `prefix` | `string` | yes | Lowercase language prefix. |
| `englishName` | `string` | yes | English language name from source when available. |
| `localName` | `string` | yes | Native language name from source when available. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/timezone/timezones.json

Collection: `timezones`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `timezone` | `string` | yes | IANA-like timezone name from source. |
| `gmtOffset` | `string` | yes | GMT offset string. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/fonts/windows-fonts.json

Collection: `windowsFonts`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `fontName` | `string` | yes | Font name from source. |
| `platform` | `'windows'` | yes | Font platform group. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/fonts/browser-fonts.json

Collection: `browserFonts`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `fontName` | `string` | yes | Font name from source. |
| `platform` | `'browser'` | yes | Font platform group. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/os/windows.json

Collection: `windowsOs`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `osName` | `string` | yes | OS name from source or retained fallback. |
| `version` | `string` | yes | OS version when parseable. |
| `build` | `string` | yes | OS build when parseable. |
| `architecture` | `string` | yes | Architecture when parseable. |
| `source` | `string` | yes | Source txt path. |
| `confidence` | `number` | yes | Import confidence. |
| `ruleVersion` | `string` | yes | Rule version. |
| `databaseVersion` | `string` | yes | Database version. |

### database/meta/import-report.json

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `importedAt` | `string` | yes | Import timestamp. |
| `ruleVersion` | `string` | yes | Import rule/schema version. |
| `databaseVersion` | `string` | yes | Database snapshot version. |
| `sourceFiles` | `SourceFileReport[]` | yes | Per-source import counts. |
| `totalRecords` | `number` | yes | Total parsed plus reported invalid records. |
| `validRecords` | `number` | yes | Records accepted into database outputs. |
| `invalidRecords` | `number` | yes | Records reported as invalid, warning, or error. |
| `warnings` | `ImportIssue[]` | yes | Non-silent warnings. |
| `errors` | `ImportIssue[]` | yes | Non-silent errors. |

## Usage Norms

### source

`source` must identify the raw-data file used by Importer.
Generator, Validator, and RiskEngine must not read `raw-data`; they may only read `source` as trace metadata from database records.

### confidence

`confidence` must be a number from `0` to `1`.
Importer may lower confidence when source data is incomplete or partially parseable.
Confidence must not be used to silently hide invalid data.

### seed

`seed` is required only for runtime generation.
Generator must use seed-based deterministic behavior in later phases.
Importer must not create or consume seed.

### ruleVersion

`ruleVersion` identifies the schema or rule set used to create or interpret an artifact.
It must be present in database envelopes, database records, RuntimePersona, ValidationResult, and RiskAssessment.

### databaseVersion

`databaseVersion` identifies the database snapshot used by downstream phases.
It must be present in every database envelope, every database record, ImportReport, RuntimePersona, ValidationResult, and RiskAssessment.

## RuntimePersona Contract Supersession

The early RuntimePersona draft in this Phase 2.5 document has been superseded by Phase 4.8.
RuntimePersona is governed by `docs/08_PERSONA_ASSEMBLY_CONTRACT.md` and `src/types/RuntimePersona.ts`.

RuntimePersona is not a database entity.
It exists only as future runtime output after explicit approval of RuntimePersona Assembly.

Current authoritative shape:

```ts
interface RuntimePersona {
  id: string;
  seed: string;
  generatedAt: string;
  schemaVersion: string;
  databaseVersion: string;
  ruleVersion: string;
  locale: LocaleResult;
  hardware: HardwareResult;
  browser: BrowserResult;
  validation: CrossValidationResult;
  sourceSummary: {
    localeSource: string;
    hardwareSource: string;
    browserSource: string;
  };
}
```

RuntimePersona must not reference `CountryRecord`, `CountryLanguagesRecord`, `TimezoneRecord`, `FontRecord`, or any other database record type.
