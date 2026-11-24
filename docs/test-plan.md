# Test Plan — Milestone 1a

## Status

Draft for review.

## Purpose

This plan defines how to verify the Cantonese-to-Jyutping conversion core and
Rime-Cantonese ingestion pipeline for Milestone 1a.

It ensures that the implementation:

- Follows `docs/conversion-rules.md`.
- Produces data consistent with `docs/data-model.md`.
- Uses and preserves provenance from the pinned source in
  `docs/data-sources.md`.
- Handles ambiguity, passthrough text, and unresolved text predictably.
- Produces reproducible test results.

## Scope

### In scope

- Unit tests for individual conversion-core modules.
- Integration tests for the conversion pipeline.
- Data-ingestion tests.
- Dictionary lookup and segmentation tests.
- Jyutping formatting tests.
- Error, edge-case, and regression tests.
- Type-level checks where practical.
- Manual linguistic validation of a small golden title set.

### Out of scope

- Browser UI tests.
- End-to-end browser automation.
- Other languages.
- Machine-learning model evaluation.
- External LLM evaluation.
- Performance benchmarking beyond basic sanity checks.
- Deployment or production monitoring tests.
- Full-dictionary exhaustive validation.

## Test principles

1. **Test the contract, not implementation details.** Tests should verify
   observable behavior and returned data structures.
2. **Use deterministic fixtures.** Unit tests must not depend on the full
   Rime-Cantonese dataset or network access.
3. **Preserve provenance.** Every dictionary-derived result must identify its
   source and source entry.
4. **Never invent expected Jyutping.** Golden values must come from a
   validated dictionary entry, official documentation, or a manually verified
   source.
5. **Make failures actionable.** A failing test should identify the input,
   expected result, actual result, and likely cause.
6. **Keep tests focused.** Each test should verify one behavior.

Vitest recommends organizing tests around the behavior or contract being
verified; each test should have a descriptive name and focused assertions. [114][96]

## Test levels

| Level | Purpose | Data used | Runs in CI |
|---|---|---|---|
| Unit | Verify isolated modules and pure functions | Small fixtures | Yes |
| Integration | Verify module cooperation and conversion flow | Small fixtures or curated normalized subset | Yes |
| Ingestion | Verify parsing, validation, normalization, and reporting | Pinned source sample or full pinned dataset | Yes, with an appropriate mode |
| Type | Verify important public type contracts | Type definitions and fixtures | Yes |
| Manual | Validate real-world linguistic correctness | Curated golden title set | No |

## Tooling

Use the tools selected in the project setup. At minimum, the project must
support:

- TypeScript type checking.
- Linting.
- Unit and integration testing.
- Test coverage reporting.
- Data-ingestion execution.

Recommended default:

- **Test runner:** Vitest
- **Type checking:** `tsc --noEmit`
- **Linting:** ESLint with TypeScript support
- **Coverage:** Vitest coverage reporting

Do not add a testing dependency without approval.

## Required npm scripts

The implementation must provide and successfully run these commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run ingest:data
```

Optional but recommended:

```bash
npm run test:unit
npm run test:integration
npm run test:ingestion
```

All commands must exit with status code `0` when successful.

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

Notes:

- Unit tests must use small, controlled fixtures.
- Integration tests may use a curated normalized subset, but must not require
  network access.
- Golden test data must be versioned in the repository.
- Do not commit private, licensed, or redistribution-restricted data without
  verifying `docs/data-sources.md`.

## Fixtures

### Dictionary fixtures

Create a small fixture dictionary containing:

- At least 10 single-character entries.
- At least 10 word entries.
- At least 5 phrase entries.
- At least 3 entries with multiple readings.
- At least 2 entries with Traditional and Simplified variants, if supported.
- At least 1 invalid entry for validation testing.
- At least 1 duplicate or conflicting entry for deterministic handling tests.

Every fixture must include:

- Stable ID
- Source name
- Source entry ID
- Entry type
- Original text
- Jyutping syllables
- Tone numbers
- Priority
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
- A very long input beyond the v1 title limit
- Input containing emoji
- Input containing unsupported CJK scripts, if applicable

Each fixture must record:

- Input
- Expected segment types
- Expected conversion behavior
- Expected final Jyutping, only when a validated reading exists
- Expected unresolved or passthrough markers
- Applicable source and provenance expectations

## Unit test requirements

### Normalization

Test that the normalizer:

- Preserves the original input string.
- Normalizes predictable whitespace.
- Classifies Cantonese Han characters correctly.
- Classifies Latin letters, digits, punctuation, whitespace, and unsupported
  scripts correctly.
- Handles empty input.
- Handles whitespace-only input.
- Handles mixed-script input.
- Does not mutate or incorrectly transform non-Cantonese characters.

### Dictionary

Test that the dictionary:

- Finds an exact character.
- Finds an exact word.
- Finds an exact phrase.
- Returns all readings for a multi-reading entry.
- Returns provenance metadata.
- Returns deterministic results for equally ranked matches.
- Handles missing entries without throwing.
- Rejects or reports malformed entries according to the data-validation rules.
- Supports lookup by Traditional and Simplified forms, if supported.

### Segmenter

Test that segmentation follows this exact priority:

1. User override
2. Exact phrase match
3. Longest phrase match
4. Word match
5. Character fallback
6. Unresolved

Specifically verify:

- A longer phrase match defeats a shorter word match.
- A word match defeats character fallback.
- An override defeats all dictionary matches.
- An unmatched Cantonese character becomes unresolved.
- Non-Cantonese text becomes passthrough.
- Offsets correctly map segments back to the original title.
- Overlapping matches are resolved deterministically.

### Converter

Test that `convertCantoneseTitle`:

- Returns a complete `ConversionResult`.
- Produces segments for all input text.
- Preserves original text and offsets.
- Selects the expected reading according to priority rules.
- Returns alternatives when available.
- Marks unresolved Cantonese text.
- Marks passthrough text.
- Includes source and confidence metadata.
- Handles empty and whitespace-only input without crashing.
- Handles input beyond the v1 length limit according to the documented rule.

### Formatter

Test that the formatter:

- Outputs tone numbers from 1 through 6.
- Separates Jyutping syllables with single spaces.
- Preserves non-Cantonese passthrough text.
- Produces the expected final Jyutping string.
- Produces the expected segment breakdown.
- Does not add, remove, or reorder input characters.

## Integration test requirements

### Conversion pipeline

Create integration tests that exercise:

`input → normalization → segmentation → lookup → conversion → formatting`

Verify that:

- A phrase-dictionary title produces a phrase-level segment.
- A word-level title produces word-level segments.
- A character-fallback title produces character-level segments.
- Mixed Cantonese and English text produces both converted and passthrough
  segments.
- Ambiguous readings are retained.
- User overrides take precedence.
- Unresolved text remains visible and marked.
- The final Jyutping string is assembled correctly.
- The result conforms structurally to `docs/data-model.md`.

### Ingestion pipeline

Create integration tests that verify:

- The ingestion script reads the pinned source files.
- It produces normalized output.
- It validates required fields.
- It rejects or quarantines malformed entries.
- It detects duplicate or conflicting entries.
- It preserves multiple readings.
- It records source and source entry IDs.
- It writes an ingestion report.
- It is deterministic for the same pinned input.
- It exits nonzero when required input is missing or invalid.

## Golden title set

Create `tests/golden/titles.json` with real song, album, and movie titles.

Include at least:

- 10 titles that convert entirely through dictionary matches.
- 5 titles with ambiguous readings.
- 5 titles with mixed scripts or punctuation.
- 5 titles that expose dictionary gaps or unresolved text.

For each golden title, record:

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

Rules:

- Do not fabricate expected Jyutping.
- If a reading cannot be validated, set `expectedFinalJyutping` to `null` and
  document the uncertainty.
- Add a golden case whenever a real-world conversion failure is discovered.
- Golden tests are regression tests, not a substitute for dictionary
  validation.

## Acceptance criteria

Milestone 1a passes when all of the following are true:

1. `npm run typecheck` passes.
2. `npm run lint` passes.
3. `npm run test` passes.
4. `npm run test:coverage` passes.
5. `npm run ingest:data` completes successfully using the pinned source.
6. Every dictionary-derived result includes source provenance.
7. Multiple readings are preserved, not overwritten.
8. Longest-match, word-match, character-fallback, override, and unresolved
   behavior matches `docs/conversion-rules.md`.
9. Non-Cantonese text is passed through unchanged.
10. No input character is silently omitted.
11. Golden-title tests pass or explicitly document a known, approved limitation.
12. The verification model finds no unresolved BLOCKER findings.
13. The user manually approves the linguistic results for the golden title set.

## Failure handling

A test failure must include:

- Test name and file
- Input
- Expected result
- Actual result
- Relevant diff or structured comparison
- Suspected cause, if determinable
- Whether the failure is a code defect, test defect, data defect, or
  specification ambiguity

If a failure reveals a specification ambiguity, stop and ask the user. Do not
change the specification or implementation silently.

## Manual validation checklist

After automated tests pass, manually verify:

- [ ] At least 10 real titles from your music and movie library.
- [ ] At least 3 titles with mixed English and Cantonese.
- [ ] At least 3 titles with ambiguous readings.
- [ ] At least 3 titles that trigger character fallback.
- [ ] At least 2 titles with unresolved text.
- [ ] At least 2 titles where a user correction is applied.
- [ ] The correction remains available after reloading or restarting the
      relevant local process, where persistence is in scope.
- [ ] Exported data can be imported without loss, if export/import is in scope.
- [ ] Dictionary source and version are visible or retrievable.
- [ ] No unexpected network request occurs during conversion.

## Traceability

Each test should trace to at least one requirement:

| Requirement area | Source document | Test coverage |
|---|---|---|
| V1 contract | `docs/product-brief.md` | Converter and integration tests |
| Conversion priority | `docs/conversion-rules.md` | Segmenter and integration tests |
| Data provenance | `docs/data-sources.md` | Dictionary, ingestion, and golden tests |
| Result structure | `docs/data-model.md` | Converter, formatter, and type tests |
| Tone-number output | `docs/product-brief.md` | Formatter tests |
| Ambiguity handling | `docs/product-brief.md` | Dictionary, converter, and golden tests |
| Unresolved handling | `docs/product-brief.md` | Converter and golden tests |
| Override behavior | `docs/product-brief.md` | Segmenter and integration tests |

## Review checklist for verification model

The verification model must check that the test plan and implementation:

- Cover every in-scope requirement.
- Do not test implementation internals instead of observable behavior.
- Use deterministic fixtures and avoid network dependence.
- Preserve provenance and source versions.
- Avoid fabricated Jyutping expectations.
- Cover ambiguity, fallback, passthrough, unresolved text, and overrides.
- Include ingestion validation and failure reporting.
- Include security-relevant input handling where applicable.
- Clearly separate automated from manual validation.
- Do not add scope beyond Milestone 1a.

Classify findings as:

- `BLOCKER`: must be fixed before implementation or merge
- `WARNING`: should be addressed, but does not block implementation
- `QUESTION`: requires a human decision

## Final test report format

At the end of Milestone 1a, provide:

```md
## Test Report

### Commands run
- Command
- Exit status
- Summary of result

### Coverage
- Statements
- Branches
- Functions
- Lines
- Notes on meaningful coverage gaps

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
- Numbered list of issues
- Severity: BLOCKER, WARNING, QUESTION
- Recommended resolution

### Verdict
- PASS, PASS WITH LIMITATIONS, or FAIL
```

## Approval gate

Before implementation begins, the verification model must review this test plan
and classify any gaps as `BLOCKER`, `WARNING`, or `QUESTION`.

No implementation work should begin until:

1. The user approves this test plan.
2. All `BLOCKER` findings are resolved.
3. All `QUESTION` findings receive an explicit user decision.
4. The implementation brief and test plan are mutually consistent.