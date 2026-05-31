# Phase 4.2 - Hardware Rule Seeds

## Purpose

This document records the first MVP hardware rule seed.
It is a manually approved rule seed, not a complete hardware market database.

## Boundary

Hardware rules are independent from Country and Locale rules.
CPU, GPU, and RAM must not be written into any CountryProfile or country database record.

This phase does not implement HardwareGenerator.
It does not generate RuntimePersona.
It does not implement BrowserGenerator, RiskEngine, or environment simulation logic.

## Source

```text
manual-hardware-rule-v1
```

## Confidence

```text
medium
```

## MVP Tiers

CPU tiers:

```text
low, mid, high, extreme
```

GPU tiers:

```text
integrated, low, mid, high, extreme
```

RAM tiers:

```text
low, mid, high, extreme
```

## Compatibility Rules

CPU to GPU:

```text
low     -> integrated, low
mid     -> integrated, low, mid
high    -> low, mid, high
extreme -> mid, high, extreme
```

CPU to RAM:

```text
low     -> low, mid
mid     -> mid, high
high    -> high, extreme
extreme -> high, extreme
```

OS hardware range:

```text
windows supports low through extreme MVP tiers.
```

## Non-Goal

This seed is intentionally small.
It is only for rule validation and later generator compatibility checks after explicit user approval.
