# Implementation Brief — Milestone 1a

## Status

Approved for implementation planning.

## Objective

Implement the framework-agnostic Cantonese-to-Jyutping conversion core and Rime-Cantonese data-ingestion pipeline.

No user interface is included in this milestone.

## Scope

### In scope

- TypeScript project initialization and strict type checking.
- A framework-agnostic conversion core.
- A Rime-Cantonese ingestion script.
- Normalized character, word, and phrase dictionary data.
- Dictionary lookup and segmentation.
- Multiple-reading preservation.
- Deterministic default-reading selection.
- Tone-number Jyutping formatting.
- Non-Cantonese passthrough handling.
- Unresolved-text handling.
- Unit, integration, ingestion, and type tests.
- Documentation updates required by implementation findings.

### Out of scope

- React, Vite, or any browser UI.
- Mandarin, Japanese, Korean, Taiwanese, or other languages.
- Machine-learning models.
- External LLM APIs.
- Cloud storage, accounts, authentication, or synchronization.
- Global dictionary overrides.
- Persistent title library.
- Persistent correction storage.
- JSON import/export.
- Tone-mark Jyutping output.
- Batch file conversion.
- File upload or download.
- Browser extension.
- Deployment infrastructure.
- Performance optimization beyond reasonable local lookup speed.

## Deferred product-level acceptance criteria

The following are part of the eventual v1 product, but are explicitly deferred beyond Milestone 1a:

- Persistent local title library.
- Persistent correction storage.
- JSON export and import.
- Browser UI correction workflow.
- End-to-end persistence tests.

Milestone 1a may represent overrides in memory, but must not implement persistence.

## Source of truth

The following documents define the product and implementation requirements:

- `docs/product-brief.md`
- `docs/data-sources.md`
- `docs/conversion-rules.md`
- `docs/data-model.md`
- `docs/test-plan.md`

If these documents conflict, stop and ask the user. Do not resolve a conflict by silently choosing an interpretation.

## Technical constraints

- Use TypeScript with strict mode enabled.
- Require Node.js `^22.13.0 || ^24.0.0 || >=26.0.0`.
- Use the same Node.js major version in local development and CI.
- Keep conversion logic independent of React, the DOM, and browser-only APIs.
- Use Node.js-compatible TypeScript for the ingestion pipeline.
- Do not add a dependency without explicit user approval.
- Use Rime-Cantonese commit `259f0e48bba840c3a2e0d117539e96937f3d89bc`.
- Use upstream source repository `CanCLID/rime-cantonese-upstream` at commit `4cb67a486312e5f0f13cc842433617104d75de87`.
- Use only the files approved in `docs/data-sources.md`.
- Do not fetch dictionary data at runtime.
- Do not invent Jyutping readings, dictionary entries, or test expectations.
- Preserve source provenance for every dictionary-derived result.
- Treat malformed, incomplete, or conflicting source entries as validation failures or quarantined records; do not silently discard them.
- Reject input longer than 100 UTF-16 code units with `INPUT_TOO_LONG`.

## Security and integrity

- Treat conversion input as untrusted text.
- Do not execute, evaluate, or interpret input or source data as code.
- Do not use `eval`, `Function`, or equivalent dynamic code execution.
- Do not make unexpected network requests during conversion.
- Pin all dependencies and review lockfile changes.
- The ingestion script must not overwrite source files or unrelated repository content.
- The ingestion script may write only to its designated output directory and report file.

## Repository structure

```text
.
├── docs/
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
│   │   └── manifest.json
│   └── normalized/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── golden/
├── package.json
├── tsconfig.json
└── README.md
```

## Required modules

### Types

Create `src/cantonese/types.ts`.

Export the complete public contract defined in `docs/data-model.md`:

- `SegmentType`
- `ReadingStatus`
- `ReadingSource`
- `SelectionReason`
- `EntryType`
- `ConversionErrorCode`
- `JyutpingSyllable`
- `ReadingProvenance`
- `Reading`
- `DictionaryEntry`
- `ConversionOverride`
- `ConversionOptions`
- `ConversionError`
- `ConversionOutcome`
- `ConversionSegment`
- `ConversionResult`

Do not duplicate type definitions across modules.

### Normalization

Create `src/cantonese/normalize.ts`.

It must:

- Preserve the original input unchanged.
- Create a separate normalized matching representation when needed.
- Classify Cantonese Han characters, Latin letters, digits, punctuation, whitespace, and unsupported scripts.
- Use UTF-16 code-unit offsets into the original input.
- Handle Traditional and Simplified Chinese according to the source-data audit.
- Not alter non-Cantonese characters.

### Dictionary

Create `src/cantonese/dictionary.ts`.

It must:

- Load normalized dictionary data.
- Support exact whole-title phrase lookup.
- Support longest-match lookup beginning at a given UTF-16 code-unit offset.
- Support word and character lookup.
- Return all relevant readings as structured `Reading` objects.
- Preserve entry source, source entry ID, source version, and priority.
- Merge multiple provenance records with the same Jyutping pronunciation into one distinct reading.
- Implement deterministic tie-breaking.

### Segmenter

Create `src/cantonese/segmenter.ts`.

Implement the matching algorithm and precedence rules in `docs/conversion-rules.md`.

### Converter

Create `src/cantonese/converter.ts`.

Expose:

```ts
convertCantoneseTitle(
  input: string,
  options?: ConversionOptions
): ConversionOutcome
```

It must:

- Return a `ConversionOutcome`, not a bare `ConversionResult`.
- Return `{ status: "ok", result }` for a successful conversion.
- Return `{ status: "error", error }` for validation failures.
- Reject input longer than 100 UTF-16 code units with `INPUT_TOO_LONG`.
- Reject invalid or overlapping overrides with the appropriate error code.
- Produce one segment for each recognized unit.
- Preserve UTF-16 code-unit offsets relative to the original input.
- Return alternatives as structured `Reading[]` containing only distinct pronunciations.
- Apply deterministic default-reading selection.
- Mark unmatched Cantonese text as unresolved.
- Mark unsupported scripts as unresolved.
- Mark non-Cantonese text as passthrough.
- Never silently omit input characters.

### Formatter

Create `src/cantonese/formatter.ts`.

It must:

- Format selected Jyutping readings using tone numbers 1–6.
- Separate Jyutping syllables with single spaces.
- Preserve non-Cantonese passthrough text and original whitespace exactly.
- Insert exactly one space only when a Cantonese segment is directly adjacent to an alphanumeric passthrough segment with no whitespace between them.
- Not insert or normalize whitespace at passthrough-to-passthrough boundaries.
- Produce `finalJyutping` only when every Cantonese segment has a selected reading, every passthrough segment is resolved, and no segment is `unresolved`.
- Provide a segment-level breakdown suitable for later UI rendering.

## Data ingestion

Create `scripts/ingest-rime-cantonese.ts`.

It must:

1. Read the pinned Rime-Cantonese files from `data/raw/`.
2. Read `data/raw/manifest.json`.
3. Verify each file exists.
4. Verify each file’s Git blob SHA against the manifest.
5. Verify each file’s SHA-256 hash against the manifest.
6. Fail clearly when a file is absent or either integrity check fails.
7. Parse the source data without executing or evaluating it.
8. Validate every entry.
9. Normalize entries into the internal data model.
10. Collapse exact duplicates.
11. Merge identical pronunciations and preserve all supporting provenance.
12. Retain distinct readings.
13. Build lookup indexes.
14. Write normalized JSON output to `data/normalized/`.
15. Emit a machine-readable ingestion report.

The ingestion report must include:

- Source repository and pinned commits
- Files processed
- Git blob SHA and SHA-256 verification results
- Entries read
- Entries accepted
- Entries rejected or quarantined
- Exact duplicates collapsed
- Identical pronunciations merged
- Distinct readings retained
- Duplicate or conflicting entries
- Character, word, and phrase counts
- Validation errors
- Output file paths
- Ingestion timestamp

## Validation rules

Validate:

- Required fields.
- Jyutping syllable structure.
- Tone numbers from 1 through 6.
- Source and source entry identifier.
- Entry type.
- Traditional and Simplified handling.
- Multiple readings.
- Exact duplicates and distinct readings.
- Identical pronunciations from multiple provenance records.
- Invalid records.
- Override kind, offset, original-text matching, and overlap.

Do not silently discard malformed records.

## Tooling and dependencies

The following is the exact proposed dependency list. Do not install any dependency until the user approves this exact list.

Runtime requirement:

- Node.js: `^22.13.0 || ^24.0.0 || >=26.0.0`

| Package | Version | License | Classification | Purpose |
|---|---:|---|---|---|
| `typescript` | `6.0.3` | Apache-2.0 | Development | TypeScript compiler and type checking |
| `vitest` | `5.1.1` | MIT | Development | Unit, integration, and ingestion tests |
| `eslint` | `10.15.0` | MIT | Development | Linting |
| `typescript-eslint` | `8.73.0` | MIT | Development | TypeScript-aware linting |
| `yaml` | `2.9.1` | ISC | Runtime, ingestion only | Safe structured parsing of pinned YAML dictionary files |

## Verification commands

Provide npm scripts for:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run ingest:data
```

All applicable commands must pass.

## Definition of done

Milestone 1a is complete when:

- The pinned Rime-Cantonese data can be ingested reproducibly.
- Raw file Git blob SHAs and SHA-256 hashes are verified before ingestion.
- The normalized dictionary is validated and contains provenance metadata.
- The conversion core produces `ConversionOutcome` results for test titles.
- Phrase, word, and character lookup follow the documented matching algorithm.
- Multiple distinct readings are preserved and exposed.
- Default reading selection is deterministic.
- Non-Cantonese text is passed through unchanged.
- Unsupported scripts are marked unresolved.
- Unresolved Cantonese text is clearly identified.
- Tone-number Jyutping is formatted consistently.
- Mixed-script boundaries use the documented spacing rule.
- All required tests, type checks, lint checks, and coverage reporting pass.
- No UI, other-language, ML, LLM, persistence, or import/export functionality has been added.
- Documentation accurately reflects the implemented behavior.

## Approval gate

Before writing implementation code, present:

1. A concise implementation plan.
2. The exact files to create or modify.
3. The exact dependency list above, including versions and licenses.
4. The test strategy.
5. Any ambiguities, conflicts, or missing decisions.

Wait for explicit user approval before generating implementation code.
