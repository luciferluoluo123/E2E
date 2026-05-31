# Phase 4.0.6 - Manual Rule Seeds

## Purpose

This document records MVP manual rule seeds approved by the user.
These rules are not inferred by Importer and are not guessed from raw-data.

## Country Timezone Seed

Source label: `manual-rule-v1`

Reason:

```text
manual_seed_for_mvp_locale_generation
```

The first seed covers priority countries needed for LocaleGenerator testing.
Only timezones that already exist in `database/timezone/timezones.json` may be written into valid `country-timezones` records.

## Non-Inference Rule

If a requested timezone is absent from `database/timezone/timezones.json`, it must be skipped and written to `import-report` warnings.
Importer must not normalize, rename, or guess equivalent timezones.

## Scope Boundary

This phase does not implement full Persona generation.
It does not create RuntimePersona.
It does not implement HardwareGenerator, BrowserGenerator, RiskEngine, or environment simulation logic.

