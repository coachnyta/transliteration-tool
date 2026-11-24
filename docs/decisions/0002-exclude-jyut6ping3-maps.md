# ADR 0002: Exclude jyut6ping3.maps from Milestone 1a

## Status

Accepted

## Date

2026-11-23

## Context

The v1 application converts Cantonese titles to tone-number Jyutping using character, word, and phrase dictionaries. It does not implement a Cantonese input method, fuzzy pronunciation matching, or reverse lookup.

Rime-Cantonese provides `jyut6ping3.maps.dict.yaml` for input-method mappings and reverse lookup. Its license is ODbL 1.0, whereas the character, word, and phrase dictionaries used by this project are CC BY 4.0.

## Decision

Use only the Rime-Cantonese character, word, and phrase dictionaries for Milestone 1a:

- `jyut6ping3.chars.dict.yaml`
- `jyut6ping3.words.dict.yaml`
- `jyut6ping3.phrase.dict.yaml`

Exclude `jyut6ping3.maps.dict.yaml`.

## Alternatives considered

- Include `jyut6ping3.maps.dict.yaml`
  - Why not: Its input-method and reverse-lookup features are outside the v1 scope, and its ODbL 1.0 requirements would add unnecessary licensing complexity.
- Build reverse lookup in v1
  - Why not: It does not support the core user goal of converting Cantonese titles to Jyutping.

## Consequences

- The ingestion pipeline is simpler.
- The project avoids ODbL 1.0 obligations for Milestone 1a.
- Reverse lookup and input-method features are deferred.
- If those features are added later, the maps file and its license requirements must be re-evaluated.
