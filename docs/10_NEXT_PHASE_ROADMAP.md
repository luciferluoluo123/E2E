# Next Phase Roadmap

## Purpose

This roadmap lists optional next directions after Phase 7.
It does not authorize implementation.
Each direction requires explicit user approval before work begins.

## Option A - BrowserGenerator

Implement a BrowserGenerator that consumes `database/browser` rule seeds and compatibility rules.

Expected boundaries:

* Must use SeededRandom and WeightEngine where selection is needed.
* Must not read `raw-data`.
* Must not bypass BrowserRuleValidator or CrossDomainValidator.
* Must not perform external browser control.

## Option B - Complete PersonaGenerator

Implement a higher-level PersonaGenerator that coordinates LocaleGenerator, HardwareGenerator, future BrowserGenerator, PersonaAssembler, CrossDomainValidator, PersonaExplainer, RiskEngine, and RiskExplainer.

Expected boundaries:

* Must not persist RuntimePersona unless a storage phase is explicitly approved.
* Must preserve deterministic seed behavior.
* Must keep Generator, Validator, RiskEngine, and Explainer responsibilities separate.

## Option C - API Layer

Implement an API layer for internal testing workflows.

Expected boundaries:

* Must expose existing pipeline operations without changing core logic.
* Must not implement UI Dashboard unless separately approved.
* Must not create external browser control.

## Option D - CLI

Implement a CLI for local rule validation, generation checks, and audit commands.

Expected boundaries:

* Must use existing services and core modules.
* Must not duplicate Generator or Validator logic.
* Must not read `raw-data` outside Importer commands.

## Option E - More Country, Timezone, and Language Rules

Expand locale data quality and coverage.

Expected boundaries:

* Importer must not guess missing meanings.
* Manual seeds must be documented as manual seeds.
* Country remains the root for Locale, Timezone, Keyboard, and Fonts.

## Option F - More Realistic Hardware Rules

Expand CPU, GPU, RAM, OS, and hardware compatibility rules.

Expected boundaries:

* Hardware remains independent from Country and Locale.
* Compatibility rules remain explicit and validated.
* Hardware data must not be written into CountryProfile or country records.

## Option G - More Browser Version Rules

Expand browser version and compatibility rule coverage.

Expected boundaries:

* Browser rules must include source, confidence, and version traceability.
* Compatibility rules must include OS and Architecture relationships.
* Browser data expansion does not imply BrowserGenerator implementation.

## Recommended Order

1. Option A - BrowserGenerator
2. Option B - Complete PersonaGenerator
3. Option D - CLI
4. Option C - API Layer
5. Option E - More locale rules
6. Option F - More hardware rules
7. Option G - More browser rules

The recommended order keeps the core runtime pipeline complete before adding interfaces or larger rule databases.
