# Data Sources

## Rime-Cantonese

- Repository: https://github.com/rime/rime-cantonese
- Pinned commit: `259f0e48bba840c3a2e0d117539e96937f3d89bc`
- Accessed: 2026-08-13
- Files used:
  - `jyut6ping3.chars.dict.yaml`
  - `jyut6ping3.words.dict.yaml`
  - `jyut6ping3.phrase.dict.yaml`
- License: verify per file; record exact license and attribution
- Coverage: characters, words, phrases
- Script variants: record Traditional/Simplified support
- Tone notation: Jyutping tone numbers 1–6
- Transformation: YAML → validation → normalized JSON/SQLite
- Regeneration: `npm run ingest:data`

## Known limitations
- Record duplicate readings, missing entries, and quality issues here.

## Attribution
- Add the exact attribution text required by the license.