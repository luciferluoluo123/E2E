# Versioning Policy

## Purpose

This document defines project version fields and forbids mixing their meanings.

## databaseVersion

`databaseVersion` identifies the standardized database output set.
It changes when imported or manually seeded database files change in a way that must be traceable.

Example:

```text
db-v1
```

## ruleVersion

`ruleVersion` identifies the active rule set used to import, validate, query, or generate a result.
It changes when rule behavior, weighting, compatibility rules, or manually approved rule seeds change.

Example:

```text
phase-4.4-browser-rule-v1
```

## schemaVersion

`schemaVersion` identifies the shape of the data contract.
It changes when required fields, field names, record structure, or envelope structure change.

Example:

```text
schema-v1
```

## Non-Mixing Rule

These fields must not be used interchangeably.

`databaseVersion` is for data set traceability.
`ruleVersion` is for rule behavior traceability.
`schemaVersion` is for structure and contract traceability.
