# Test Plan — Milestone 1a

## Status

Approved for implementation planning.

## Purpose

This plan defines how to verify the Cantonese-to-Jyutping conversion core and Rime-Cantonese ingestion pipeline for Milestone 1a.

## Scope

### In scope

- Unit tests for conversion-core modules.
- Integration tests for the conversion pipeline.
- Data-ingestion tests.
- Dictionary lookup and segmentation tests.
- Jyutping formatting tests.
- Error, edge-case, and regression tests.
- Type-level checks where practical.
- Manual linguistic validation of a golden title set.

### Out of scope

- Browser UI tests.
- End-to-end browser automation.
- Other languages.
- Machine-learning model evaluation.
- External LLM evaluation.
- Performance benchmarking beyond basic sanity checks.
- Deployment or production monitoring tests.
- Full-dictionary exhaustive validation.
- Persistent title library tests.
- Persistent correction storage tests.
- JSON import/export tests.

## Deferred product-level acceptance criteria

The following are part of the eventual v1 product, but are explicitly deferred beyond Milestone 1a:

- Correction persistence after reload or restart.
- Local title library persistence.
- JSON export and import.
- Browser UI correction workflow.
- End-to-end persistence tests.

Milestone 1a may test in-memory override behavior, but must not test persistence.

## Test principles

1. Test observable behavior, not implementation details.
2. Use deterministic fixtures; do not require network access in unit tests.
3. Preserve provenance for every dictionary-derived result.
4. Never invent expected Jyutping.
5. Make failures actionable.
6. Keep each test focused on one behavior.

## Tooling

Use the tools approved in the implementation plan.

Runtime requirement:

- Node.js: `^22.13.0 || >=24.0.0`

Approved dependency versions and licenses:

- `typescript` `6.0.3`, Apache-2.0
- `vitest` `5.1.1`, MIT
- `eslint` `10.15.0`, MIT
- `typescript-eslint` `8.73.0`, MIT
- `yaml` `2.9.1`, ISC

## Required commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run ingest:data
```

All applicable commands must exit with status code `0`.

## Test file layout

```text
tests/
├── unit/
│   ├── normalize.test.ts
│   ├── dictionary.test.ts
│   ├── segmenter.test.ts
│   ├── converter.test.ts
│   └── formatter.test.ts
├── integration/
│   ├── conversion-pipeline.test.ts
│   └── ingestion-pipeline.test.ts
├── fixtures/
│   ├── dictionary/
│   ├── titles/
│   └── ingestion/
└── golden/
    └── titles.json
```

## Fixtures

### Dictionary fixtures

Create a small fixture dictionary containing:

- At least 10 character entries.
- At least 10 word entries.
- At least 5 phrase entries.
- At least 3 entries with multiple readings.
- At least 2 entries with Traditional and Simplified variants, if supported.
- At least 1 invalid entry.
- At least 1 exact duplicate entry.
- At least 1 same-text/different-reading conflict.
- At least 1 case with identical Jyutping from multiple source entry IDs.
- At least 1 case with a non-null priority and one with `null` priority.

Every fixture must include:

- Stable ID
- Source name
- Source entry ID
- Entry type
- Original text
- Jyutping syllables
- Tone numbers
- Priority, which may be `null`
- Provenance records
- Alternatives, where applicable

### Title fixtures

Create at least 20 title fixtures covering:

- A single common Cantonese word
- A multi-word Cantonese phrase
- A title found in the phrase dictionary
- A title requiring word-level matching
- A title requiring character fallback
- A title with an ambiguous character
- A title with an unresolved character
- A title with English letters
- A title with digits
- A title with punctuation
- A title with whitespace
- A title mixing Cantonese and English
- A title with Traditional Chinese
- A title with Simplified Chinese, if supported
- A title with repeated characters
- An empty string
- Whitespace-only input
- Input longer than 100 UTF-16 code units
- Input containing emoji
- Input containing supplementary-plane characters
- Input with repeated whitespace
- Input containing unsupported CJK scripts, such as Korean Hangul or Japanese kana

## Mandatory matching tests

Verify:

- Whole-title exact phrase match takes precedence over partial phrase matching.
- A longer phrase candidate defeats a shorter phrase candidate.
- A phrase match defeats a word match.
- A word match defeats character fallback.
- Character fallback occurs only when no word or phrase match exists.
- `select-alternative` override defeats all dictionary matches and preserves dictionary provenance.
- `replace-reading` override defeats all dictionary matches and uses `user-override` or `manual-entry` provenance.
- Equal-length candidates resolve by non-null dictionary priority.
- A non-null priority outranks `null` priority.
- Equal-length and equal-priority candidates resolve by stable source order.
- Matching is anchored at the current UTF-16 code-unit offset.
- Offsets remain correct for emoji, supplementary-plane characters, repeated whitespace, and mixed scripts.

## Mandatory ambiguity tests

| Case | Expected `segmentType` | Expected `readingStatus` | Expected `selectedReading` | Expected `selectionReason` |
|---|---|---|---|---|
| One credible reading | `cantonese` | `resolved` | Required | `dictionary-default`, `highest-priority`, or `stable-source-order` |
| Multiple readings with explicit dictionary default | `cantonese` | `ambiguous` | Required | `dictionary-default` |
| Multiple readings with different non-null priorities | `cantonese` | `ambiguous` | Required | `highest-priority` |
| Multiple readings with equal non-null priorities | `cantonese` | `ambiguous` | Required | `stable-source-order` |
| Multiple readings with all `null` priorities | `cantonese` | `ambiguous` | Required | `stable-source-order` |
| `select-alternative` override among alternatives | `cantonese` | `ambiguous` | Required | `user-override` |
| `replace-reading` override with distinct Jyutping | `cantonese` | `ambiguous` | Required | `user-override` |
| `replace-reading` override with Jyutping identical to an existing alternative | `cantonese` | `ambiguous` | Required | `user-override` |
| Cantonese text with no reading | `cantonese` | `unresolved` | `null` | `none` |
| Passthrough text | `passthrough` | `resolved` | `null` | `none` |
| Unsupported script | `unresolved` | `unresolved` | `null` | `none` |

Additional assertions:

- `selectedReading` must be non-null when `readingStatus` is `resolved`.
- In Milestone 1a, `selectedReading` must be non-null when `readingStatus` is `ambiguous` because stable source order always selects a default.
- `selectedReading` must be `null` when `readingStatus` is `unresolved`.
- `selectedReading` must be one of `alternatives` when non-null.
- Every alternative must retain structured provenance.
- Identical Jyutping from multiple source entry IDs must produce one alternative, not false ambiguity.
- A distinct replacement reading must be added to `alternatives`.
- A replacement reading with Jyutping identical to an existing dictionary alternative must not create a duplicate alternative.
- Original dictionary alternatives and their provenance must be retained when a replacement override is applied.
- `finalJyutping` must be `null` when any segment is `unresolved` or any Cantonese segment lacks a selected reading.
- A user override must set `userOverride: true` and `selectionReason: "user-override"`.

## Mandatory error tests

Verify:

- Input longer than 100 UTF-16 code units returns `{ status: "error", error: { code: "INPUT_TOO_LONG" } }`.
- An override with mismatched offsets or original text returns `INVALID_OVERRIDE`.
- A `select-alternative` override referencing an unavailable reading returns `INVALID_OVERRIDE`.
- Overlapping overrides return `OVERLAPPING_OVERRIDES`.
- A successful conversion returns `{ status: "ok", result }`.
- No typed exception is used for expected validation failures.

## Unit test requirements

### Normalization

Verify:

- Original input preservation.
- Separate normalized matching representation.
- Correct character classification.
- Empty and whitespace-only input.
- Mixed-script input.
- Emoji and supplementary-plane characters.
- Repeated whitespace.
- Non-Cantonese characters remain unchanged.
- Unsupported scripts are marked unresolved.
- UTF-16 code-unit offset correctness.

### Dictionary

Verify:

- Exact whole-title phrase lookup.
- Longest-match lookup at a given offset.
- Word lookup.
- Character lookup.
- Multiple-reading retrieval.
- Provenance metadata.
- Merging identical pronunciations from multiple source entries.
- Distinct-pronunciation retention.
- Deterministic ordering for equal-priority readings.
- `null` priority handling.
- Missing-entry behavior.
- Invalid-entry handling.
- Traditional and Simplified lookup, if supported.

### Segmenter

Verify:

- `select-alternative` override precedence and provenance preservation.
- `replace-reading` override precedence.
- Override validation against the exact established segment span.
- A `select-alternative` override referencing a reading outside the segment returns `INVALID_OVERRIDE`.
- A distinct replacement reading is added to `alternatives`.
- A replacement reading with Jyutping identical to an existing dictionary alternative does not create a duplicate alternative.
- Original dictionary alternatives and provenance are retained after a replacement override.
- Whole-title exact phrase precedence.
- Longest phrase precedence.
- Word precedence over character fallback.
- Character fallback.
- Unresolved Cantonese text.
- Passthrough text.
- Unsupported-script text.
- Offset correctness.
- Deterministic tie-breaking.
- Invalid override rejection.
- Overlapping override rejection.

### Converter

Verify:

- Complete `ConversionOutcome` structure.
- Segment coverage of all input text.
- Correct reading selection.
- Alternatives retention.
- Ambiguous handling.
- Unresolved handling.
- Passthrough handling.
- Unsupported-script handling.
- Empty and whitespace-only input.
- Input longer than 100 UTF-16 code units returns `INPUT_TOO_LONG`.
- `finalJyutping` completeness rules across all unresolved segments.
- No unexpected network request.

### Formatter

Verify:

- Tone numbers 1–6.
- Space-separated syllables.
- Passthrough preservation.
- One-space boundary only between Cantonese and alphanumeric passthrough with no existing whitespace.
- No added boundary space around punctuation-to-English boundaries.
- Final Jyutping assembly.
- Segment breakdown.
- No input-character loss.

## Integration tests

### Conversion pipeline

Verify:

```text
input → validation → classification → segmentation → lookup → override validation → reading selection → formatting
```

Specifically:

- Phrase-level conversion.
- Word-level conversion.
- Character fallback.
- Mixed Cantonese and English.
- Ambiguous readings.
- `select-alternative` overrides.
- `replace-reading` overrides with distinct replacement Jyutping.
- `replace-reading` overrides with Jyutping identical to an existing dictionary alternative.
- Unresolved text.
- Unsupported scripts.
- Correct final Jyutping when complete.
- `finalJyutping: null` when incomplete.
- Structural conformance to `docs/data-model.md`.

### Ingestion pipeline

Verify:

- Pinned source files are read from `data/raw/`.
- `data/raw/manifest.json` is read.
- File presence, Git blob SHA, and SHA-256 hash are verified before parsing.
- A missing raw file causes a clear failure.
- A Git blob SHA mismatch causes a clear failure.
- A SHA-256 mismatch causes a clear failure.
- Source data is parsed without execution or evaluation.
- Normalized JSON output is produced.
- Required fields are validated.
- Malformed entries are rejected or quarantined.
- Exact duplicates are collapsed.
- Distinct readings are retained.
- Identical pronunciations from multiple source entries are merged while preserving provenance.
- Source and source entry IDs are retained.
- Ingestion report is generated.
- Deterministic output for the same pinned input.
- Nonzero exit on missing or invalid required input.
- No source files or unrelated repository content are overwritten.

## Golden title set

Create `tests/golden/titles.json` with real song, album, and movie titles.

Include at least:

- 10 titles that convert entirely through dictionary matches.
- 5 titles with ambiguous readings.
- 5 titles with mixed scripts or punctuation.
- 5 titles that expose dictionary gaps or unresolved text.

For each title, record:

```json
{
  "id": "golden-001",
  "title": "<original title>",
  "category": "song | album | movie",
  "expectedBehavior": "exact | ambiguous | partial | unresolved",
  "expectedSegments": [],
  "expectedFinalJyutping": "<only if independently validated>",
  "expectedUnresolved": [],
  "notes": ""
}
```

Do not fabricate expected Jyutping. If a reading cannot be validated, set `expectedFinalJyutping` to `null` and document the uncertainty.

## Acceptance criteria

Milestone 1a passes when:

1. `npm run typecheck` passes.
2. `npm run lint` passes.
3. `npm run test` passes.
4. `npm run test:coverage` passes.
5. `npm run ingest:data` completes successfully using the pinned source.
6. Every dictionary-derived result includes source provenance.
7. Multiple distinct readings are preserved.
8. Default selection follows the documented deterministic order.
9. Matching follows the documented anchored, longest-first, tie-broken algorithm.
10. Offsets use UTF-16 code units and refer to the original input.
11. Non-Cantonese text is passed through unchanged.
12. Unsupported scripts are marked unresolved.
13. No input character is silently omitted.
14. Input longer than 100 UTF-16 code units returns `INPUT_TOO_LONG`.
15. Golden-title tests pass or explicitly document an approved limitation.
16. The verification model finds no unresolved `BLOCKER` findings.
17. The user manually approves linguistic results for the golden title set.

## Manual validation checklist

- [ ] At least 10 real titles from your music and movie library.
- [ ] At least 3 titles with mixed English and Cantonese.
- [ ] At least 3 titles with ambiguous readings.
- [ ] At least 3 titles that trigger character fallback.
- [ ] At least 2 titles with unresolved text.
- [ ] At least 2 titles where an in-memory user correction is applied.
- [ ] Dictionary source and version are visible or retrievable.
- [ ] No unexpected network request occurs during conversion.

## Traceability

| Requirement area | Source document | Test coverage |
|---|---|---|
| V1 contract | `docs/product-brief.md` | Converter and integration tests |
| Matching algorithm | `docs/conversion-rules.md` | Segmenter and integration tests |
| Ambiguity representation | `docs/data-model.md` | Converter, formatter, and ambiguity tests |
| Default selection | `docs/conversion-rules.md` | Segmenter, converter, and ambiguity tests |
| Offset contract | `docs/data-model.md` | Normalization and converter tests |
| Data provenance | `docs/data-sources.md` | Dictionary, ingestion, and golden tests |
| Result structure | `docs/data-model.md` | Converter, formatter, and type tests |
| Error contract | `docs/data-model.md` | Converter and integration tests |
| Tone-number output | `docs/product-brief.md` | Formatter tests |
| Unresolved handling | `docs/product-brief.md` | Converter and golden tests |
| Override behavior | `docs/product-brief.md` | Segmenter and integration tests |
| Security and integrity | `docs/implementation-brief.md` | Ingestion and converter tests |

## Review checklist

The verification model must check that:

- Every in-scope requirement is covered.
- Tests verify observable behavior.
- Fixtures are deterministic and offline.
- Provenance and source versions are preserved.
- No Jyutping expectation is fabricated.
- Ambiguity, fallback, passthrough, unresolved text, and overrides are covered.
- Matching, tie-breaking, and offset behavior are covered.
- Ingestion validation, duplicate handling, and failure reporting are covered.
- Persistence, title library, and import/export are explicitly deferred.
- No scope is added beyond Milestone 1a.

Classify findings as:

- `BLOCKER`
- `WARNING`
- `QUESTION`

## Final test report format

```md
## Test Report

### Commands run
- Command
- Exit status
- Summary

### Coverage
- Statements
- Branches
- Functions
- Lines
- Meaningful coverage gaps

### Test results
- Total tests
- Passed
- Failed
- Skipped
- Known limitations

### Golden-title validation
- Titles tested
- Titles passed
- Titles with ambiguity
- Titles unresolved
- Manual corrections required

### Issues found
- Numbered findings
- Severity
- Recommended resolution

### Verdict
- PASS, PASS WITH LIMITATIONS, or FAIL
```
