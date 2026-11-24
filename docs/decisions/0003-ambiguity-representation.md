# ADR 0003: Represent ambiguity as reading status, not segment type

## Status

Accepted

## Date

2026-11-23

## Context

The original model used `segmentType` for both input classification and reading certainty. This made it impossible to represent a Cantonese segment with multiple plausible readings without losing information.

The reviewer identified this as a blocker because `segmentType` defined only `cantonese`, `passthrough`, and `unresolved`, while the conversion rules required the application to distinguish ambiguity as well.

## Decision

Separate input classification from reading certainty:

- `segmentType`: `cantonese`, `passthrough`, `unresolved`
- `readingStatus`: `resolved`, `ambiguous`, `unresolved`
- `selectedReading`: a structured `Reading` object or `null`
- `alternatives`: all credible `Reading` objects
- `selectionReason`: deterministic explanation for the selected reading

A `Reading` includes:

- Jyutping string
- Structured syllables and tone numbers
- Source
- Source entry ID
- Source version
- Priority
- Default flag

## Alternatives considered

- Add `ambiguous` to `segmentType`
  - Why not: A segment can be both Cantonese and ambiguous.
- Store alternatives as plain strings
  - Why not: This loses provenance and prevents deterministic selection.
- Require the user to choose every ambiguous reading
  - Why not: This creates unnecessary friction when a source provides a reliable default.

## Consequences

- The UI can show alternatives without changing the segment classification.
- Every selected reading retains dictionary provenance.
- Default selection is deterministic and testable.
- Ambiguous segments without a usable default require user action.
- The final Jyutping is incomplete until every Cantonese segment has a selected reading.
