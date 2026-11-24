# Implementation Brief — Milestone 1a

## Status

Draft for review.

## Objective

Implement the framework-agnostic Cantonese-to-Jyutping conversion core and
the Rime-Cantonese data-ingestion pipeline.

This milestone must produce a local, testable TypeScript module that can:

1. Ingest and normalize a pinned Rime-Cantonese dataset.
2. Look up Cantonese text using exact-phrase, longest-phrase, word, and
   character-level matching.
3. Return structured conversion results with selected readings,
   alternatives, provenance, confidence, and unresolved indicators.
4. Format Cantonese readings as tone-number Jyutping.

No user interface is included in this milestone.

## Scope

### In scope

- TypeScript project initialization and strict type checking.
- A framework-agnostic conversion core.
- A Rime-Cantonese ingestion script.
- Normalized character, word, and phrase dictionary data.
- Dictionary lookup and segmentation.
- Multiple-reading preservation.
- Tone-number Jyutping formatting.
- Non-Cantonese passthrough handling.
- Unresolved-text handling.
- Unit and integration tests.
- Documentation updates required by implementation findings.

### Out of scope

Do not implement any of the following in Milestone 1a:

- React, Vite, or any browser UI.
- Mandarin, Japanese, Korean, Taiwanese, or other languages.
- Machine-learning models.
- External LLM APIs.
- Cloud storage, accounts, authentication, or synchronization.
- Global dictionary overrides.
- Tone-mark Jyutping output.
- Batch file conversion.
- File upload or download.
- Browser extension.
- Deployment infrastructure.
- Performance optimization beyond reasonable local lookup speed.

## Source of truth

The following documents define the product and implementation requirements:

- `docs/product-brief.md`
- `docs/data-sources.md`
- `docs/conversion-rules.md`
- `docs/data-model.md`
- `docs/test-plan.md`

If these documents conflict, stop and ask the user. Do not resolve a conflict
by silently choosing an interpretation.

## Technical constraints

- Use TypeScript with strict mode enabled.
- Keep conversion logic independent of React, the DOM, and browser-only APIs.
- Use Node.js-compatible TypeScript for the ingestion pipeline.
- Do not add a dependency without explicit user approval.
- Use only the pinned Rime-Cantonese commit and files listed in
  `docs/data-sources.md`.
- Do not fetch dictionary data at runtime.
- Do not invent Jyutping readings, dictionary entries, or test expectations.
- Preserve source provenance for every dictionary-derived result.
- Treat malformed, incomplete, or conflicting source entries as validation
  failures or quarantined records; do not silently discard them.

## Repository structure

Use this initial structure:

```text
.
├── docs/
│   ├── product-brief.md
│   ├── data-sources.md
│   ├── conversion-rules.md
│   ├── data-model.md
│   ├── implementation-brief.md
│   └── test-plan.md
├── scripts/
│   └── ingest-rime-cantonese.ts
├── src/
│   └── cantonese/
│       ├── index.ts
│       ├── types.ts
│       ├── normalize.ts
│       ├── segmenter.ts
│       ├── dictionary.ts
│       ├── converter.ts
│       └── formatter.ts
├── data/
│   ├── raw/
│   └── normalized/
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

Notes:

- `src/cantonese/` contains only the conversion core.
- `scripts/` contains the ingestion pipeline.
- `data/raw/` may contain source-derived or downloaded data only if permitted
  by the applicable license and repository policy.
- `data/normalized/` contains generated, validated, normalized data.
- Generated data must be reproducible from the pinned source commit.
- Do not place React code in this milestone.

## Required modules

### Types

Create `src/cantonese/types.ts`.

It must export types consistent with `docs/data-model.md`, including at least:

- `DictionaryEntry`
- `ConversionSegment`
- `ConversionResult`
- `SegmentType`
- `ReadingSource`
- `Confidence`
- `JyutpingSyllable`

Do not duplicate type definitions across modules. Import shared types from
`types.ts`.

### Normalization

Create `src/cantonese/normalize.ts`.

It must:

- Normalize whitespace in a predictable way.
- Preserve the original input text for display and offset calculation.
- Classify characters into Cantonese Han characters, Latin letters, digits,
  punctuation, whitespace, and unsupported scripts.
- Detect Traditional and Simplified Chinese according to the coverage recorded
  in `docs/data-sources.md`.
- Not alter non-Cantonese characters.

### Dictionary

Create `src/cantonese/dictionary.ts`.

It must:

- Load normalized dictionary data.
- Support exact lookup by character, word, and phrase.
- Support longest-match lookup beginning at a given text offset.
- Return all relevant readings for a matched entry.
- Preserve entry source, source entry ID, entry type, and priority.
- Expose a deterministic ordering rule for equally ranked matches.

The dictionary implementation must not depend on React or browser APIs.

### Segmenter

Create `src/cantonese/segmenter.ts`.

It must implement the conversion priority defined in
`docs/conversion-rules.md`:

1. User override.
2. Exact phrase match.
3. Longest phrase match.
4. Word match.
5. Character fallback.
6. Unresolved.

For Milestone 1a, user overrides may be represented as an input parameter or
in-memory override collection. Persistent override storage is not required.

### Converter

Create `src/cantonese/converter.ts`.

It must expose a single primary conversion function with an interface
equivalent to:

```ts
convertCantoneseTitle(
  input: string,
  options?: ConversionOptions
): ConversionResult
```

It must:

- Accept a short Cantonese title.
- Return a `ConversionResult` conforming to `docs/data-model.md`.
- Produce one segment for each recognized unit.
- Preserve offsets relative to the original input.
- Return alternatives when a dictionary entry has multiple readings.
- Mark unmatched Cantonese text as unresolved.
- Mark non-Cantonese text as passthrough.
- Never silently omit input characters.

### Formatter

Create `src/cantonese/formatter.ts`.

It must:

- Format selected Jyutping readings using tone numbers 1–6.
- Separate Jyutping syllables with a single space.
- Preserve non-Cantonese passthrough text unchanged.
- Produce a final Jyutping string for the full title.
- Provide a segment-level breakdown suitable for UI rendering in a later
  milestone.

## Data ingestion

Create `scripts/ingest-rime-cantonese.ts`.

The script must:

1. Read the Rime-Cantonese files and pinned commit recorded in
   `docs/data-sources.md`.
2. Parse the source data.
3. Validate every entry.
4. Normalize entries into the internal data model.
5. Deduplicate or explicitly retain duplicate readings according to
   `docs/data-sources.md` and `docs/conversion-rules.md`.
6. Write normalized output to `data/normalized/`.
7. Emit a machine-readable ingestion report.

The ingestion report must include:

- Source repository and pinned commit
- Files processed
- Entries read
- Entries accepted
- Entries rejected or quarantined
- Duplicate or conflicting entries
- Character, word, and phrase counts
- Validation errors
- Output file paths
- Ingestion timestamp

The script must be rerunnable and must produce deterministic output for the
same pinned input and configuration.

## Validation rules

The ingestion pipeline must validate:

- Required fields are present.
- Jyutping syllables use valid Jyutping structure.
- Tone numbers are integers from 1 through 6.
- Entries have a source and source entry identifier.
- Character, word, and phrase entries are distinguishable.
- Traditional and Simplified forms are handled according to the source-data
  audit.
- Multiple readings are retained.
- Duplicate entries are detected and handled deterministically.
- Invalid records are rejected or quarantined with a clear reason.

Do not use regular expressions as the sole validation mechanism for Jyutping
if a more reliable validation approach is available.

## Error handling

The conversion core must:

- Return a structured unresolved result rather than throwing for ordinary
  unknown text.
- Clearly distinguish:
  - `unresolved`: Cantonese text with no dictionary reading
  - `passthrough`: non-Cantonese text intentionally left unchanged
  - `ambiguous`: multiple plausible readings exist
- Include enough information for a future UI to display alternatives and
  corrections.

The ingestion script must:

- Fail with a clear error for invalid configuration or missing source files.
- Report invalid data entries rather than silently skipping them.
- Exit nonzero when validation failures prevent production of a trustworthy
  normalized dataset.

## Testing requirements

Write tests before or alongside implementation. Tests must cover:

- Jyutping formatting and tone-number validation.
- Character classification.
- Normalization.
- Exact phrase matching.
- Longest-match behavior.
- Word matching.
- Character fallback.
- Multiple readings.
- Unresolved Cantonese text.
- Non-Cantonese passthrough.
- Offset correctness.
- Override precedence.
- Dictionary-source provenance.
- Ingestion validation and error reporting.

Use a small fixture dictionary for unit tests. Do not depend on the full
Rime-Cantonese dataset for every unit test.

Integration tests may use a small, curated subset of normalized data or mocked
dictionary data, provided the test purpose and limitations are documented.

## Verification commands

The implementation must include npm scripts for at least:

```bash
npm run typecheck
npm run lint
npm run test
npm run ingest:data
```

The implementation is not complete unless all applicable commands pass.

If a command is not applicable, explain why in the final report rather than
removing it silently.

## Definition of done

Milestone 1a is complete when:

- The pinned Rime-Cantonese data can be ingested reproducibly.
- The normalized dictionary is validated and contains provenance metadata.
- The conversion core produces structured results for test titles.
- Phrase, word, and character lookup follow the documented priority order.
- Multiple readings are preserved and exposed.
- Non-Cantonese text is passed through unchanged.
- Unresolved Cantonese text is clearly identified.
- Tone-number Jyutping is formatted consistently.
- All required tests, type checks, and lint checks pass.
- No UI, other-language, ML, or LLM functionality has been added.
- Documentation accurately reflects the implemented behavior.

## Deliverables

The final pull request or change set must include:

- TypeScript conversion core.
- Ingestion script.
- Normalized data-generation capability.
- Tests.
- Updated documentation where needed.
- A concise implementation report.

## Implementation report format

At the end of the milestone, provide:

```md
## Implementation Report

### Files changed
- List every created or modified file.

### Dependencies added
- List every dependency, version, purpose, and license.

### Data processed
- Source repository and pinned commit
- Files processed
- Entry counts by type
- Validation failures
- Output files

### Tests
- List test files and describe coverage.
- Include the exact commands run and their results.

### Known limitations
- List known gaps, unresolved design questions, and deferred work.

### Deviations
- List every deviation from the planning documents, with justification.
```

## Approval gate

Before writing implementation code, present:

1. A concise implementation plan.
2. The exact files to create or modify.
3. Dependencies to add, if any.
4. The test strategy.
5. Any ambiguities, conflicts, or missing decisions.

Wait for explicit user approval before generating implementation code.