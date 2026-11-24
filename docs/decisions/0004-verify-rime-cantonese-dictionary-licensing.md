# ADR 0004: Verify Rime-Cantonese dictionary licensing per file

## Status

Accepted

## Date

2026-11-23

## Context

The Rime-Cantonese README identifies the main work as CC BY 4.0 and specifically identifies `jyut6ping3.maps` as ODbL 1.0. The three dictionary files used by Milestone 1a identify `CanCLID/rime-cantonese-upstream` as their upstream source.

The upstream repository contains a repository-level CC BY 4.0 `LICENSE` file at commit `4cb67a486312e5f0f13cc842433617104d75de87`.

## Decision

Treat `jyut6ping3.chars.dict.yaml`, `jyut6ping3.words.dict.yaml`, and `jyut6ping3.phrase.dict.yaml` as CC BY 4.0, subject to recorded per-file integrity verification before ingestion.

Exclude `jyut6ping3.maps.dict.yaml` because it is ODbL 1.0 and outside Milestone 1a scope.

## Evidence

- Rime-Cantonese repository: https://github.com/rime/rime-cantonese
- Rime-Cantonese pinned commit: `259f0e48bba840c3a2e0d117539e96937f3d89bc`
- Upstream source repository: https://github.com/CanCLID/rime-cantonese-upstream
- Upstream pinned commit: `4cb67a486312e5f0f13cc842433617104d75de87`
- Upstream license: https://github.com/CanCLID/rime-cantonese-upstream/blob/4cb67a486312e5f0f13cc842433617104d75de87/LICENSE

The evidence chain is:

1. The Rime-Cantonese dictionary files identify `CanCLID/rime-cantonese-upstream` as their upstream source.
2. The upstream repository contains the complete Creative Commons Attribution 4.0 International license text.
3. The Rime-Cantonese README describes the main work as CC BY 4.0 and specifically identifies `jyut6ping3.maps` as ODbL 1.0.
4. The three dictionary files are not part of the explicitly ODbL-licensed `jyut6ping3.maps` scope.
5. No conflicting per-file license statement has been identified in the dictionary file headers.

## Source integrity manifest

Create `data/raw/manifest.json` with one entry per approved file. Each entry must record:

- File name
- Upstream repository and pinned commit
- Rime-Cantonese pinned commit
- Git blob SHA
- SHA-256 hash
- License
- Ingestion-readiness status

Known Git blob SHAs:

- `jyut6ping3.chars.dict.yaml`: `f31eb5e66b0f26b6427306c514aa42d396c13a97`
- `jyut6ping3.words.dict.yaml`: `5e581cee9fd38e6063e0ea90bc947e9299bdc3e3`
- `jyut6ping3.phrase.dict.yaml`: to be recorded from the pinned upstream commit

The SHA-256 hash is recorded after the raw file is committed locally. A file may not be marked `ready` until both its Git blob SHA and SHA-256 hash are recorded and verified.

## Ingestion requirements

Before ingestion, the pipeline must verify for each dictionary file:

- The file exists in `data/raw/`.
- The file Git blob SHA matches the recorded manifest value.
- The file SHA-256 hash matches the recorded manifest value.
- The upstream repository and pinned commits are recorded.
- No conflicting per-file license statement is present.
- The file is not part of the ODbL-licensed `jyut6ping3.maps` scope.
- The source-audit prerequisites that affect normalization and selection are complete.

A missing file or integrity mismatch must stop ingestion with a clear error. Ingestion must not produce normalized output or silently skip a file.

Licensing approval and ingestion readiness are separate states.

## Attribution

When dictionary-derived material is shared, use attribution that includes:

- Credit to the Cantonese Computational Linguistics Infrastructure Development Workgroup (CanCLID)
- A link to the upstream repository
- The upstream commit
- A link to CC BY 4.0
- A statement that the data was parsed and normalized for this project
- Retention of any supplied copyright, disclaimer, or attribution notice

## Alternatives considered

- Treat the files as approved solely from the Rime-Cantonese README
  - Why not: Repository-level README evidence alone does not document the per-file evidence and integrity-verification gate.
- Treat the files as pending verification indefinitely
  - Why not: The upstream license and source provenance provide sufficient evidence to support CC BY 4.0, provided the per-file integrity checks are recorded.
- Include `jyut6ping3.maps.dict.yaml`
  - Why not: It is ODbL 1.0 and its input-method and reverse-lookup features are outside Milestone 1a scope; see ADR 0002.

## Consequences

- The licensing decision is explicit, evidence-backed, and mechanically checkable.
- Ingestion is gated on Git blob SHA and SHA-256 verification.
- Attribution remains required when dictionary-derived material is shared.
- Future dictionary updates require review of upstream license changes, updated hashes, and updated attribution.

## Related documents

- `docs/data-sources.md`
- `docs/decisions/0001-use-rime-cantonese.md`
- `docs/decisions/0002-exclude-jyut6ping3-maps.md`
