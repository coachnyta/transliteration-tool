# Product Brief

## Problem
Cantonese titles often need reliable Jyutping with tone numbers,
but character-by-character conversion can be wrong or ambiguous.

## User
I am the sole user. I want to convert short Cantonese song, album,
and movie titles into Jyutping.

## V1 user story
As a user, I enter a short Cantonese title and immediately see
tone-number Jyutping, a segment-level breakdown, alternate readings
where applicable, and unresolved indicators. I can save corrections
locally.

## In scope
- Cantonese text to Jyutping
- Tone numbers 1–6
- Word/phrase and character lookup
- Alternative readings
- Local title library and corrections
- JSON export/import

## Out of scope
- Mandarin, Japanese, Korean, and Taiwanese
- Machine translation
- Speech synthesis
- Accounts or cloud sync
- ML-based reading selection
- External LLM integration

## Success criteria
- Common dictionary words convert correctly.
- Ambiguous readings are visible rather than silently chosen.
- Unknown characters are marked unresolved.
- Corrections persist after a browser reload.