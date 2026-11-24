# Data Sources

## Status

Active.

## Purpose

This document records the external linguistic data used by the Cantonese-to-Jyutping conversion core, including source, version, license, coverage, transformation, duplicate handling, and known limitations.

No dictionary data may be used until its license, provenance, and transformation requirements are recorded here.

## Primary source: Rime-Cantonese

- Project: Rime-Cantonese
- Maintainer: Cantonese Computational Linguistics Infrastructure Development Workgroup (CanCLID)
- Repository: https://github.com/rime/rime-cantonese
- Pinned commit: `259f0e48bba840c3a2e0d117539e96937f3d89bc`
- Accessed: 2026-11-23
- Upstream README: https://github.com/rime/rime-cantonese/blob/main/README-en.md

Rime-Cantonese is the primary and only dictionary source for Milestone 1a. It supplies Cantonese pronunciations in LSHK Jyutping for individual Chinese characters, Cantonese words, and Cantonese phrases.

## Romanization scheme

The application uses the LSHK Jyutping Romanization Scheme.

The v1 output format is tone-number Jyutping:

- Tone numbers: 1 through 6
- Syllables separated by single spaces
- Example format: `hoi2 fut3 tin1 hung1`

## Files used

| File | Purpose | License | Status |
|---|---|---|---|
| `jyut6ping3.chars.dict.yaml` | Character-level Cantonese readings | CC BY 4.0 | Approved |
| `jyut6ping3.words.dict.yaml` | Word-level Cantonese readings | CC BY 4.0 | Approved |
| `jyut6ping3.phrase.dict.yaml` | Phrase-level Cantonese readings | CC BY 4.0 | Approved |

### License interpretation

The Rime-Cantonese README states that the main part of the work is released under Creative Commons Attribution 4.0 International (CC BY 4.0), while `jyut6ping3.maps` is released under the Open Data Commons Open Database License v1.0 (ODbL 1.0).

The three dictionary files above are therefore provisionally treated as CC BY 4.0.

Before ingestion, verify each file at the pinned commit and record:

- Exact commit hash
- File hash or checksum
- Embedded license or provenance metadata
- Attribution requirements
- Any local modifications

### Attribution

Display or make available the following attribution in the application and repository:

```text
Cantonese pronunciation data derived from Rime-Cantonese by the
Cantonese Computational Linguistics Infrastructure Development Workgroup
(CanCLID), licensed under CC BY 4.0.
https://github.com/rime/rime-cantonese
https://creativecommons.org/licenses/by/4.0/
```

Indicate that the data has been adapted or transformed for use in this application.

## Files explicitly excluded

| File | Reason | License | Status |
|---|---|---|---|
| `jyut6ping3.maps.dict.yaml` | Supports Rime input-method mappings and reverse lookup, outside Milestone 1a scope | ODbL 1.0 | Excluded |
| `jyut6ping3_ipa.schema.yaml` | IPA output is outside v1 requirements | Verify before future use | Excluded |
| Other Rime schema/configuration files | Input-method configuration, not pronunciation dictionary data | Verify before future use | Excluded |

## Source audit

The following source characteristics must be verified from the pinned commit before finalizing normalization and deduplication behavior.

| Characteristic | Status | Decision |
|---|---|---|
| Traditional Chinese coverage | `TODO: audit` | Record after audit |
| Simplified Chinese coverage | `TODO: audit` | Record after audit |
| Multiple readings per entry | `TODO: audit` | Retain all distinct readings |
| Duplicate entries | `TODO: audit` | Deduplicate exact duplicates; retain distinct readings |
| Missing required fields | `TODO: audit` | Reject or quarantine with reason |
| Frequency or priority data | `TODO: audit` | Use only if present and reliable |
| Phrase coverage | `TODO: audit` | Record after audit |
| Proper-noun coverage | `TODO: audit` | Record after audit |

### Duplicate and conflict policy

- Two entries are exact duplicates when they have the same source entry identity, original text, entry type, and complete Jyutping reading.
- Exact duplicates must be collapsed into one normalized entry.
- Entries with the same text but different Jyutping readings must be retained as distinct readings.
- Entries with the same text and reading but different source entry IDs must be retained unless the audit determines that they represent true duplicates.
- Duplicate resolution must be deterministic and recorded in the ingestion report.
- No reading may be silently discarded.

## Expected coverage

Record observed coverage after ingestion. Do not state coverage as fact until the ingestion report has been generated.

| Data type | Expected use | Coverage status |
|---|---|---|
| Characters | Character-level fallback | `TODO: verify after ingestion` |
| Words | Word-level matching | `TODO: verify after ingestion` |
| Phrases | Exact and longest phrase matching | `TODO: verify after ingestion` |
| Multiple readings | Alternative-reading display and disambiguation | `TODO: verify after ingestion` |
| Traditional Chinese | Primary or supported input form | `TODO: verify after audit and ingestion` |
| Simplified Chinese | Supported input form, if present | `TODO: verify after audit and ingestion` |
| Proper nouns and names | May require manual review or overrides | `TODO: verify after ingestion` |

## Data transformation

### Input

- Rime-Cantonese YAML dictionary files
- Pinned commit: `259f0e48bba840c3a2e0d117539e96937f3d89bc`
- Files listed in **Files used**
- Raw source files are committed to `data/raw/`

### Output

Normalized application data stored as JSON in:

```text
data/normalized/
```

### Pipeline

```text
Rime-Cantonese YAML
→ parse
→ validate
→ normalize
→ deduplicate exact duplicates
→ retain distinct readings
→ build lookup indexes
→ write normalized JSON
→ generate ingestion report
```

### Normalized record requirements

Every accepted entry must retain:

- Stable internal ID
- Source name: `rime-cantonese`
- Source entry ID or deterministic source-derived identifier
- Original source text
- Entry type: `character`, `word`, or `phrase`
- Jyutping syllables
- Tone numbers
- Priority or frequency-derived ranking, where available
- Alternative readings, where present
- Traditional and Simplified forms, where applicable
- License and source-version metadata

### Reproducibility

The ingestion process must be rerunnable from the pinned commit and produce deterministic normalized output.

Required command:

```bash
npm run ingest:data
```

The ingestion report must record:

- Source repository and pinned commit
- Files processed
- Entries read
- Entries accepted
- Entries rejected or quarantined
- Exact duplicates collapsed
- Distinct readings retained
- Duplicate or conflicting entries
- Entry counts by type
- Validation errors
- Output file paths
- Ingestion timestamp

## Validation rules

Before an entry is accepted, validate that:

- Required fields are present.
- Entry type is recognized.
- Jyutping syllables are structurally valid.
- Tone numbers are integers from 1 through 6.
- Source and source entry identifier are present.
- Traditional and Simplified forms are handled according to the source audit.
- Multiple readings are retained rather than overwritten.
- Exact duplicates are collapsed deterministically.
- Distinct readings are retained.
- Invalid entries are rejected or quarantined with a clear reason.

Do not silently discard malformed records.

## Security and integrity

- The ingestion script must not execute, evaluate, or interpret source data as code.
- The ingestion script must not overwrite source files or unrelated repository content.
- The ingestion script may write only to its designated output directory and report file.
- Dependencies must be pinned and lockfile changes reviewed.
- The application must not make unexpected network requests during conversion.

## Known limitations

- Proper nouns, song titles, album titles, and movie titles may not have phrase-level dictionary coverage.
- Titles may contain intentional nonstandard readings, wordplay, English, numbers, punctuation, or mixed scripts.
- Character-level fallback may produce technically valid but contextually incorrect readings.
- Multiple readings may require user selection or manual override.
- Dictionary coverage and quality must be verified empirically after ingestion.
- Upstream data may change; the application must pin and record the version used.

## Update policy

To update the dictionary:

1. Select a new upstream commit.
2. Review the diff and any license changes.
3. Update the pinned commit and accessed date in this document.
4. Run the ingestion pipeline.
5. Review the ingestion report.
6. Run all automated tests.
7. Re-run the golden-title validation set.
8. Update known limitations and coverage status.
9. Record the update in the changelog or relevant architecture decision record.

Do not automatically update dictionary data without review.

## Related documents

- `docs/product-brief.md`
- `docs/conversion-rules.md`
- `docs/data-model.md`
- `docs/implementation-brief.md`
- `docs/test-plan.md`
- `docs/decisions/0001-use-rime-cantonese.md`
- `docs/decisions/0002-exclude-jyut6ping3-maps.md`
- `docs/decisions/0003-ambiguity-representation.md`
