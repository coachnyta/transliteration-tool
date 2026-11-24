# ADR 0001: Use Rime-Cantonese as the primary dictionary

## Status
Accepted

## Date
2026-11-23

## Context
The app needs offline Cantonese-to-Jyutping conversion for short
titles. It requires character, word, and phrase coverage, multiple
readings, and clear licensing.

## Decision
We will use Rime-Cantonese as the primary v1 data source.

## Alternatives considered
- Build a dictionary from scratch
- Use only a character-level dictionary
- Use CC-Canto as the primary source

## Consequences
- We gain phrase, word, and character coverage.
- We must parse and normalize YAML dictionary files.
- We must verify and display license attribution.
- We depend on upstream data quality and update cadence.