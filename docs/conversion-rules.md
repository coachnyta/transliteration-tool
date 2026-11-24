# Conversion Rules

## Status

Active.

## Purpose

This document defines the deterministic behavior of the Cantonese-to-Jyutping conversion pipeline.

## Pipeline

```text
input title
→ validate input and overrides
→ classify characters
→ segment using original input offsets
→ dictionary lookup
→ select reading
→ format Jyutping
→ return ConversionOutcome
```

## Input contract

- The original input is treated as untrusted text.
- The original input must not be mutated.
- All segment offsets refer to the original input using UTF-16 code-unit indices.
- The maximum supported title length is 100 UTF-16 code units.
- Input longer than 100 UTF-16 code units returns `{ status: "error", error: { code: "INPUT_TOO_LONG" } }`.
- Invalid overrides return `{ status: "error", error: { code: "INVALID_OVERRIDE" } }`.
- Overlapping overrides return `{ status: "error", error: { code: "OVERLAPPING_OVERRIDES" } }`.
- Normalization may create a separate normalized matching representation, but must not change original offsets.
- The converter must not make unexpected network requests.
- The converter must not execute or evaluate input as code.

## Character classification

Classify each character as:

- Cantonese Han character
- Latin letter
- Digit
- Punctuation
- Whitespace
- Unsupported script

Latin letters, digits, punctuation, and whitespace are non-Cantonese text and must pass through unchanged.

Unsupported scripts—for example Korean Hangul, Japanese kana, or other non-Cantonese CJK scripts—are marked `segmentType: "unresolved"` and `readingStatus: "unresolved"`. They must remain visible and prevent a complete final Jyutping result.

## Matching algorithm

Matching is performed at the current input offset.

At each offset:

1. If a `select-alternative` override exists for this exact segment, select the referenced existing alternative.
2. If a `replace-reading` override exists for this exact segment, use the supplied replacement reading.
3. If the entire normalized title exactly matches one dictionary phrase, use that phrase.
4. Otherwise, find all dictionary phrase candidates that begin at the current offset.
5. Select the candidate with the greatest phrase length.
6. If multiple candidates have the same length, select the candidate with the highest non-null dictionary priority.
7. If multiple candidates have the same length and equal non-null priority, select the candidate with the lowest source entry ID.
8. If source entry IDs are equal or unavailable, use stable source order.
9. If no phrase candidate exists, find word candidates beginning at the current offset and apply the same length, priority, and stable-order rules.
10. If no word candidate exists, attempt character-level lookup.
11. If no character reading exists, mark the Cantonese text unresolved.
12. Advance to the end of the selected segment and repeat.

### Match precedence

| Rank | Match type | Rule |
|---|---|---|
| 1 | User override | Always wins |
| 2 | Exact whole-title phrase match | The entire normalized title matches one dictionary phrase |
| 3 | Longest phrase match | Greatest phrase length at the current offset |
| 4 | Word match | Greatest word length at the current offset |
| 5 | Character fallback | Single-character lookup |
| 6 | Unresolved | No credible reading found |

### Tie-breaking

When candidates have the same match type and length:

1. A non-null dictionary priority outranks `null`.
2. Higher non-null dictionary priority wins.
3. If priority is equal, lower source entry ID wins.
4. If source entry IDs are equal or unavailable, earlier stable source order wins.

## Default reading selection

When a matched dictionary entry has multiple distinct readings, select a default deterministically.

Selection order:

1. If the user explicitly selected a reading, use that reading.
2. If the dictionary entry explicitly marks one reading as default or primary, use that reading.
3. If one or more readings have a non-null priority or frequency value, use the reading with the highest non-null value.
4. If all candidate readings have `null` priority, use stable source order.

Stable source order always provides a deterministic default. Therefore, in Milestone 1a, an `ambiguous` segment always has a non-null `selectedReading`.

`selectedReading: null` remains type-legal for an `ambiguous` segment only as a forward-compatible state; no Milestone 1a conversion path produces it.

A `null` priority means that the source provides no usable priority or frequency value. It must not be assigned an arbitrary numeric default.

### Stable source order

Stable source order is determined by:

1. Ascending `sourceEntryId`, compared as a string.
2. If source entry IDs are equal or unavailable, the order of first appearance in the normalized dictionary during ingestion.

This ordering must be deterministic across ingestion runs. It must not depend on unstable YAML parser behavior or source-file formatting.

### Selection reasons

| Value | Meaning |
|---|---|
| `user-override` | The user explicitly selected or replaced the reading |
| `dictionary-default` | The source marked the reading as default or primary |
| `highest-priority` | The reading had the highest available non-null priority or frequency |
| `stable-source-order` | Equal or missing priorities were resolved using stable source order |
| `none` | No default could be selected; not produced by Milestone 1a rules |

## Ambiguity policy

- A segment with exactly one distinct credible Jyutping pronunciation is `resolved`.
- A segment with more than one distinct credible Jyutping pronunciation is `ambiguous`.
- Multiple provenance records with the same Jyutping pronunciation must be merged into one reading and must not create ambiguity.
- In Milestone 1a, an ambiguous segment always has a non-null `selectedReading` because stable source order selects a default.
- `selectedReading: null` for an ambiguous segment is type-legal only for forward compatibility.
- Ambiguity does not change `segmentType`; it is represented by `readingStatus`.
- The selected reading must be one of the entries in `alternatives` when it exists.
- Every distinct alternative retains structured provenance for every supporting source entry.

## Non-Cantonese text

- Latin letters, digits, punctuation, and whitespace pass through unchanged.
- Mark them as `segmentType: "passthrough"`.
- Set `readingStatus: "resolved"`, `selectedReading: null`, and `alternatives: []`.

## Unresolved text

- Cantonese text with no credible dictionary reading is marked `segmentType: "cantonese"` and `readingStatus: "unresolved"`.
- Unsupported scripts are marked `segmentType: "unresolved"` and `readingStatus: "unresolved"`.
- Unresolved text must remain visible in the result.
- Unresolved text must not be silently omitted.

## Output formatting

- Use tone numbers 1 through 6.
- Separate Jyutping syllables with a single space.
- Preserve non-Cantonese passthrough text and original whitespace exactly.
- Concatenate converted and passthrough segments in original order.
- If a Cantonese segment is directly adjacent to an alphanumeric passthrough segment and there is no whitespace between them, insert exactly one space.
- Do not insert or normalize whitespace at passthrough-to-passthrough boundaries, including punctuation-to-English boundaries.
- Produce `finalJyutping` only when every Cantonese segment has a selected reading, every passthrough segment is resolved, and no segment is `unresolved`.
- Otherwise, set `finalJyutping` to `null` and `isComplete` to `false`.

Examples, using validated dictionary readings for `<jyutping>`:

| Original input | Expected final output |
|---|---|
| `中文English中文` | `<jyutping> English <jyutping>` |
| `中文 English 中文` | `<jyutping> English <jyutping>` |
| `中文。English` | `<jyutping>。English` |
| `中文。 English` | `<jyutping>。 English` |
| `中文123中文` | `<jyutping> 123 <jyutping>` |
| `中文。` | `<jyutping>。` |

## User overrides

- A user override always takes precedence over dictionary output for that segment.
- A user override must preserve the original segment and its offset.
- A user override must set `userOverride: true` and `selectionReason: "user-override"`.
- `select-alternative` selects an existing dictionary alternative and preserves its dictionary provenance.
- `replace-reading` supplies a new pronunciation with `source: "user-override"` or `"manual-entry"`.
- In Milestone 1a, overrides are supplied through the `ConversionOptions.overrides` array.
- Overrides must match the original input exactly at their declared UTF-16 offsets.
- Overlapping overrides are invalid and return `OVERLAPPING_OVERRIDES`.
- Persistent override storage is not required.

## Completeness

`isComplete` is true only when:

- Every Cantonese segment has a selected reading.
- Every passthrough segment is resolved.
- No segment has `segmentType: "unresolved"`.

`finalJyutping` is `null` if any of those conditions fails.
