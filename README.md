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
npm run ingest:data
```

The ingestion command is not ready to run until the pinned raw dictionary files and verified manifest are approved and installed.

## Scope

The conversion API will remain framework-agnostic and will not use React, DOM, browser-only APIs, network requests, dynamic code execution, or persistence.

Persistent title storage, correction storage, JSON import/export, and browser UI workflows are deferred beyond Milestone 1a.
