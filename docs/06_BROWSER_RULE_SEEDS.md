# Phase 4.4 - Browser Rule Seeds

## Purpose

This document records the first MVP browser rule seed.
It is a manually approved rule seed, not a complete browser market database.

## Boundary

This phase establishes browser data and browser rule validation only.
It does not implement BrowserGenerator.
It does not generate RuntimePersona.
It does not implement RiskEngine, RuntimePersona assembly, full Persona Generator, or environment simulation logic.

## Source

```text
manual-browser-rule-v1
```

## Confidence

```text
medium
```

## MVP Browser Records

The first seed includes Chrome, Edge, and Firefox major versions for Windows compatibility checks.
Each browser record must include:

```text
id, name, majorVersion, weight, source, confidence
```

## Compatibility Scope

Browser compatibility rules express:

```text
Browser <-> OS
Browser <-> Architecture
```

The first MVP seed supports:

```text
Chrome  -> Windows10, Windows11, x64
Edge    -> Windows10, Windows11, x64
Firefox -> Windows10, Windows11, x64
```

## Non-Goal

This seed is intentionally small.
It is only for browser rule validation and later generator compatibility checks after explicit user approval.
