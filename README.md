# Cantonese-to-Jyutping Transliteration Tool

Milestone 1a provides a framework-agnostic TypeScript conversion core and Rime-Cantonese ingestion pipeline. The implementation does not include a browser UI or persistent storage.

## Requirements

- Node.js `^22.13.0 || ^24.0.0 || >=26.0.0`
- npm

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run ingest:data -- <manifest-path> <output-directory>
```

Ingestion reads a JSON manifest and raw dictionary files only from local paths. It verifies every manifest SHA-256 before parsing, writes only `dictionary.json` and `ingestion-report.json`, and does not download source data.

The real Rime-Cantonese raw-data gate remains blocked until the three pinned dictionaries, source audit, verified Git blob SHAs, and verified SHA-256 hashes are approved and installed. Offline fixture ingestion may be run with a validated fixture manifest.

## Conversion Core Usage

The public entry point exports the complete public types and the framework-agnostic conversion API:

```ts
import { convertCantoneseTitle } from "./src/cantonese/index.js";

const outcome = convertCantoneseTitle("中文 English");
```

The converter is deterministic, offline, and does not execute input or source data.

## Scope

The conversion API is framework-agnostic and does not use React, DOM, browser-only APIs, network requests, dynamic code execution, or persistence.

Persistent title storage, correction storage, JSON import/export, and browser UI workflows are deferred beyond Milestone 1a. Raw dictionaries, normalized output, and ingestion are not ready in this commit.
