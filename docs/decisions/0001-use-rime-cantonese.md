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

The pinned Rime-Cantonese commit is:

https://github.com/rime/rime-cantonese/tree/259f0e48bba840c3a2e0d117539e96937f3d89bc

The upstream source repository and pinned commit are:

https://github.com/CanCLID/rime-cantonese-upstream/tree/4cb67a486312e5f0f13cc842433617104d75de87

The upstream license is:

https://github.com/CanCLID/rime-cantonese-upstream/blob/4cb67a486312e5f0f13cc842433617104d75de87/LICENSE

The detailed source, licensing, ingestion, and duplicate-policy requirements are recorded in `docs/data-sources.md`.

## Alternatives considered
- Build a dictionary from scratch
- Use only a character-level dictionary
- Use CC-Canto as the primary source

## Consequences
- We gain phrase, word, and character coverage.
- We must parse and normalize YAML dictionary files.
- We must verify and display license attribution.
- We depend on upstream data quality and update cadence.
- The `jyut6ping3.maps` file remains excluded because it is ODbL 1.0 and outside Milestone 1a scope; see ADR 0002.
