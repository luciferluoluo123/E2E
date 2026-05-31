# Phase 4.8 - Persona Assembly Contract

## Purpose

This document defines the final contract for a future RuntimePersona assembly step.
It is a contract only.
It does not implement RuntimePersona Assembly.
It does not generate Persona.
It does not implement BrowserGenerator, RiskEngine, or environment simulation logic.

## Flow

```text
LocaleResult
HardwareResult
BrowserResult
  ->
RuntimePersona
```

## RuntimePersona Fields

`id` identifies the assembled runtime result.

`seed` records the deterministic seed used by upstream generation steps.

`generatedAt` records when the future assembly step creates the runtime result.

`schemaVersion` records the structure contract version.

`databaseVersion` records the standardized database version used by upstream results.

`ruleVersion` records the rule set version used by upstream results and validation.

`locale` references the LocaleResult produced by LocaleGenerator.

`hardware` references the HardwareResult produced by HardwareGenerator.

`browser` references the BrowserResult produced by a future Browser generation step after explicit approval.

`validation` references CrossValidationResult.

`sourceSummary` records the top-level traceability summary for Locale, Hardware, and Browser sources.

RuntimePersona must not contain database entities.
RuntimePersona may only reference LocaleResult, HardwareResult, BrowserResult, and validation output.
The legacy RuntimePersona draft formerly present in `src/types/domain.ts` is deprecated and must not be used as the RuntimePersona contract.
The only authoritative RuntimePersona type is `src/types/RuntimePersona.ts`.

## PersonaAssemblyInput

PersonaAssemblyInput must contain only:

```ts
{
  locale: LocaleResult;
  hardware: HardwareResult;
  browser: BrowserResult;
}
```

No other input fields are allowed in this contract.

## PersonaAssemblyResult

PersonaAssemblyResult must contain:

```ts
{
  persona: RuntimePersona;
  crossValidationResult: CrossValidationResult;
}
```

The future assembly step must not skip cross-domain validation.

## sourceSummary

`sourceSummary` must contain:

```json
{
  "localeSource": "string",
  "hardwareSource": "string",
  "browserSource": "string"
}
```

Purpose:

```text
localeSource   -> trace LocaleResult source
hardwareSource -> trace HardwareResult source
browserSource  -> trace BrowserResult source
```

## Version Fields

`schemaVersion` identifies the RuntimePersona contract shape.

Example:

```text
schema-v1
```

`databaseVersion` identifies the standardized database output set used by upstream results.

Example:

```text
db-v1
```

`ruleVersion` identifies the active rule set used by upstream generation and validation.

Example:

```text
phase-4.8-persona-assembly-contract
```

These fields must not be mixed.

## RuntimePersona Example

```json
{
  "id": "persona_example_001",
  "seed": "12345",
  "generatedAt": "2026-05-30T00:00:00.000Z",
  "schemaVersion": "schema-v1",
  "databaseVersion": "db-v1",
  "ruleVersion": "phase-4.8-persona-assembly-contract",
  "locale": {
    "countryCode": "JP",
    "language": {
      "code": "ja-JP",
      "prefix": "ja",
      "englishName": "Japanese",
      "localName": "Japanese",
      "weight": 1,
      "source": "database/locale/country-languages.json",
      "confidence": 0.9,
      "ruleVersion": "phase-4.8-persona-assembly-contract",
      "databaseVersion": "db-v1"
    },
    "acceptLanguage": "ja-JP,ja;q=0.9",
    "timezone": {
      "timezone": "Asia/Tokyo",
      "gmtOffset": "GMT+09:00",
      "source": "database/timezone/timezones.json",
      "confidence": 0.95,
      "ruleVersion": "phase-4.8-persona-assembly-contract",
      "databaseVersion": "db-v1"
    },
    "fonts": [
      {
        "fontName": "Yu Gothic",
        "platform": "windows",
        "source": "database/fonts/windows-fonts.json",
        "confidence": 0.9,
        "ruleVersion": "phase-4.8-persona-assembly-contract",
        "databaseVersion": "db-v1"
      }
    ],
    "source": "database/locale/country-languages.json|database/timezone/timezones.json|database/fonts/windows-fonts.json",
    "confidence": 0.9,
    "reasons": [],
    "ruleVersion": "phase-4.8-persona-assembly-contract",
    "databaseVersion": "db-v1"
  },
  "hardware": {
    "cpu": {
      "id": "cpu-mid-001",
      "name": "MVP Mid CPU",
      "tier": "mid",
      "weight": 5,
      "source": "manual-hardware-rule-v1",
      "confidence": "medium"
    },
    "gpu": {
      "id": "gpu-mid-001",
      "name": "MVP Mid GPU",
      "tier": "mid",
      "weight": 4,
      "source": "manual-hardware-rule-v1",
      "confidence": "medium"
    },
    "ram": {
      "id": "ram-8gb",
      "name": "8 GB RAM",
      "tier": "mid",
      "weight": 5,
      "source": "manual-hardware-rule-v1",
      "confidence": "medium"
    },
    "os": {
      "osName": "Windows11",
      "version": "mvp",
      "build": "mvp",
      "architecture": "x64",
      "source": "database/os/windows.json",
      "confidence": "medium",
      "ruleVersion": "phase-4.8-persona-assembly-contract",
      "databaseVersion": "db-v1"
    },
    "source": "manual-hardware-rule-v1|database/os/windows.json",
    "confidence": "medium",
    "reasons": [],
    "ruleVersion": "phase-4.8-persona-assembly-contract",
    "databaseVersion": "db-v1"
  },
  "browser": {
    "id": "chrome-138",
    "name": "Chrome",
    "majorVersion": 138,
    "source": "manual-browser-rule-v1",
    "confidence": "medium",
    "ruleVersion": "phase-4.8-persona-assembly-contract",
    "databaseVersion": "db-v1"
  },
  "validation": {
    "passed": true,
    "score": 100,
    "warnings": [],
    "errors": [],
    "checkedAt": "2026-05-30T00:00:00.000Z",
    "ruleVersion": "phase-4.8-persona-assembly-contract",
    "databaseVersion": "db-v1"
  },
  "sourceSummary": {
    "localeSource": "database/locale/country-languages.json|database/timezone/timezones.json|database/fonts/windows-fonts.json",
    "hardwareSource": "manual-hardware-rule-v1|database/os/windows.json",
    "browserSource": "manual-browser-rule-v1"
  }
}
```
