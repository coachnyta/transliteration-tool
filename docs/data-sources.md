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
- Upstream source repository: https://github.com/CanCLID/rime-cantonese-upstream
- Upstream pinned commit: `4cb67a486312e5f0f13cc842433617104d75de87`
- Upstream license: https://github.com/CanCLID/rime-cantonese-upstream/blob/4cb67a486312e5f0f13cc842433617104d75de87/LICENSE

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
| `jyut6ping3.chars.dict.yaml` | Character-level Cantonese readings | CC BY 4.0 | Approved, subject to recorded per-file hash verification |
| `jyut6ping3.words.dict.yaml` | Word-level Cantonese readings | CC BY 4.0 | Approved, subject to recorded per-file hash verification |
| `jyut6ping3.phrase.dict.yaml` | Phrase-level Cantonese readings | CC BY 4.0 | Approved, subject to recorded per-file hash verification |

### License interpretation

The Rime-Cantonese README states that the main part of the work is released under Creative Commons Attribution 4.0 International (CC BY 4.0), while `jyut6ping3.maps` is released under the Open Data Commons Open Database License v1.0 (ODbL 1.0).

The three dictionary files identify `CanCLID/rime-cantonese-upstream` as their upstream source. That upstream repository contains a repository-level `LICENSE` file with the complete Creative Commons Attribution 4.0 International license text at commit `4cb67a486312e5f0f13cc842433617104d75de87`.

The evidence supporting CC BY 4.0 for the three dictionary files is therefore:

- The Rime-Cantonese README distinguishes `jyut6ping3.maps` as ODbL 1.0 and describes the main work as CC BY 4.0.
- The upstream repository identified by the dictionary files contains the CC BY 4.0 license text.
- The three dictionary files are not part of the explicitly ODbL-licensed `jyut6ping3.maps` scope.
- No conflicting per-file license statement has been identified in the dictionary file headers.

The files are therefore approved under CC BY 4.0, subject to the ingestion gate below.

### Per-file verification record

Before ingestion, record for each approved file:

- Exact upstream repository and pinned commit
- Exact file path
- Exact file SHA-256 hash
- File header and embedded provenance metadata
- Confirmation that the repository-level CC BY 4.0 license applies
- Confirmation that no conflicting per-file license statement is present
- Confirmation that the file is not part of the ODbL-licensed `jyut6ping3.maps` scope
- Any local adaptation or transformation

The ingestion script must fail clearly if a raw file is absent or its SHA-256 hash does not match the recorded hash.

### Attribution

Display or make available the following attribution in the application and repository:

```text
Cantonese pronunciation data adapted from Rime Cantonese by the
Cantonese Computational Linguistics Infrastructure Development Workgroup
(CanCLID), licensed under Creative Commons Attribution 4.0 International.
Source: https://github.com/CanCLID/rime-cantonese-upstream
Upstream commit: 4cb67a486312e5f0f13cc842433617104d75de87
License: https://creativecommons.org/licenses/by/4.0/
Changes: Parsed and normalized for use by this project.
```

Retain any copyright, disclaimer, or attribution notice supplied by the upstream project.

## Ingestion gate

The ingestion pipeline may ingest a dictionary file only after verifying:

- The upstream repository and pinned commit.
- The file exists at that commit.
- The file SHA-256 hash matches the recorded hash.
- The repository-level CC BY 4.0 license applies.
- No conflicting per-file license statement is present.
- The file is not part of the ODbL-licensed `jyut6ping3.maps` scope.

If any check fails, ingestion must stop with a clear error. It must not produce normalized output or silently skip the file.

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
| Frequency or priority data | `TODO: audit` | Use only if present and reliable; otherwise use `null` |
| Phrase coverage | `TODO: audit` | Record after audit |
| Proper-noun coverage | `TODO: audit` | Record after audit |

### Duplicate and conflict policy

- Two entries are exact duplicates when they have the same source entry identity, original text, entry type, and complete Jyutping reading.
- Exact duplicates must be collapsed into one normalized entry.
- Entries with the same text but different Jyutping readings must be retained as distinct readings.
- Entries with the same text and identical Jyutping reading but different source entry IDs must be merged into one distinct pronunciation.
- The merged pronunciation must preserve every supporting source entry as provenance.
- Distinct pronunciations are determined by the complete Jyutping reading, not by source entry ID.
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
- Rime-Cantonese pinned commit: `259f0e48bba840c3a2e0d117539e96937f3d89bc`
- Upstream source repository: `CanCLID/rime-cantonese-upstream`
- Upstream pinned commit: `4cb67a486312e5f0f13cc842433617104d75de87`
- Files listed in **Files used**
- Raw source files are committed to `data/raw/`

### Source acquisition

Raw dictionary files must be committed to `data/raw/` at the pinned commits. The ingestion pipeline must not download files at runtime.

Before ingestion, the pipeline must verify the SHA-256 hash of every raw file against a recorded manifest. A missing file or hash mismatch must cause a clear ingestion failure.

### Output

Normalized application data stored as JSON in:

```text
data/normalized/
```

### Pipeline

```text
Rime-Cantonese YAML
→ verify file presence and SHA-256 hash
→ parse
→ validate
→ normalize
→ deduplicate exact duplicates
→ merge identical pronunciations and preserve provenance
→ retain distinct readings
→ build lookup indexes
→ write normalized JSON
→ generate ingestion report
```

The proposed YAML parser is `yaml`. Its exact version and license must be listed and approved before installation. The parser must be used only to parse structured YAML data; it must not execute, evaluate, or interpret source content as code.

### Normalized record requirements

Every accepted entry must retain:

- Stable internal ID
- Source name: `rime-cantonese`
- Source entry ID or deterministic source-derived identifier
- Original source text
- Entry type: `character`, `word`, or `phrase`
- Jyutping syllables
- Tone numbers
- Priority or frequency-derived ranking, where available; otherwise `null`
- Alternative readings, where present
- Traditional and Simplified forms, where applicable
- License and source-version metadata

### Reproducibility

The ingestion process must be rerunnable from the pinned commits and produce deterministic normalized output.

Required command:

```bash
npm run ingest:data
```

Stable source order is determined by:

1. Ascending `sourceEntryId`, compared as a string.
2. If source entry IDs are equal or unavailable, the order of first appearance in the normalized dictionary during ingestion.

This ordering must be deterministic across ingestion runs and must not depend on unstable YAML parser behavior or source-file formatting.

The ingestion report must record:

- Source repository and pinned commits
- Files processed
- File SHA-256 hashes and verification results
- Entries read
- Entries accepted
- Entries rejected or quarantined
- Exact duplicates collapsed
- Identical pronunciations merged
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
- Identical pronunciations from multiple provenance records are merged without creating false ambiguity.
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
3. Update the pinned commits and accessed date in this document.
4. Update the recorded file hashes.
5. Run the ingestion pipeline.
6. Review the ingestion report.
7. Run all automated tests.
8. Re-run the golden-title validation set.
9. Update known limitations and coverage status.
10. Record the update in the changelog or relevant architecture decision record.

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
