# Conversion Rules

## Status

Active.

## Purpose

This document defines the deterministic behavior of the Cantonese-to-Jyutping conversion pipeline.

## Pipeline

```text
input title
→ classify characters
→ segment using original input offsets
→ dictionary lookup
→ select reading
→ format Jyutping
→ return structured result
```

## Input contract

- The original input is treated as untrusted text.
- The original input must not be mutated.
- All segment offsets refer to the original input using UTF-16 code-unit indices.
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

Non-Cantonese characters must be preserved unchanged.

## Matching algorithm

Matching is performed at the current input offset.

At each offset:

1. If a user override exists for this exact segment, apply it.
2. If the entire normalized title exactly matches one dictionary phrase, use that phrase.
3. Otherwise, find all dictionary phrase candidates that begin at the current offset.
4. Select the candidate with the greatest phrase length.
5. If multiple candidates have the same length, select the candidate with the highest dictionary priority.
6. If multiple candidates have the same length and priority, select the candidate with the lowest source entry ID; if source entry IDs are equal or unavailable, use stable insertion order.
7. If no phrase candidate exists, find word candidates beginning at the current offset and apply the same length, priority, and stable-order rules.
8. If no word candidate exists, attempt character-level lookup.
9. If no character reading exists, mark the Cantonese text unresolved.
10. Advance to the end of the selected segment and repeat.

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

1. Higher dictionary priority wins.
2. If priority is equal, lower source entry ID wins.
3. If source entry IDs are equal or unavailable, earlier stable insertion order wins.

## Default reading selection

When a matched dictionary entry has multiple readings, select a default deterministically.

Selection order:

1. If the user explicitly selected a reading, use that reading.
2. If the dictionary entry explicitly marks one reading as default or primary, use that reading.
3. If the source provides a frequency or priority value, use the reading with the highest value.
4. If multiple readings have equal priority, use the reading that appears first in the normalized dictionary’s stable ordering.
5. If no deterministic order can be established, do not select a default. Mark the segment `ambiguous`, set `selectedReading` to `null`, and require user selection before producing a final Jyutping result.

### Selection reasons

| Value | Meaning |
|---|---|
| `user-override` | The user explicitly selected the reading |
| `dictionary-default` | The source marked the reading as default or primary |
| `highest-priority` | The reading had the highest available priority or frequency |
| `stable-source-order` | Equal-priority readings were resolved using stable source order |
| `none` | No default could be selected; user decision required |

## Ambiguity policy

- A segment with exactly one credible reading is `resolved`.
- A segment with more than one credible reading is `ambiguous`.
- An ambiguous segment may still have a `selectedReading` if a deterministic default exists.
- An ambiguous segment without a deterministic default has `selectedReading: null`.
- Ambiguity does not change `segmentType`; it is represented by `readingStatus`.
- The selected reading must be one of the entries in `alternatives` when it exists.
- Every alternative retains its own source, source entry ID, source version, priority, and default flag.

## Non-Cantonese text

- Latin letters, digits, punctuation, and unsupported scripts pass through unchanged.
- Mark them as `segmentType: "passthrough"`.
- Set `readingStatus: "resolved"`, `selectedReading: null`, and `alternatives: []`.

## Unresolved text

- Cantonese text with no credible dictionary reading is marked `segmentType: "cantonese"` and `readingStatus: "unresolved"`.
- Text that cannot be classified or converted is marked `segmentType: "unresolved"` and `readingStatus: "unresolved"`.
- Unresolved text must remain visible in the result.
- Unresolved text must not be silently omitted.

## Output formatting

- Use tone numbers 1 through 6.
- Separate Jyutping syllables with a single space.
- Preserve non-Cantonese passthrough text unchanged.
- Produce `finalJyutping` only when every Cantonese segment has a selected reading.
- If any Cantonese segment lacks a selected reading, set `finalJyutping` to `null` and `isComplete` to `false`.

## User overrides

- A user override always takes precedence over dictionary output for that segment.
- A user override must preserve the original segment and its offset.
- A user override must set `userOverride: true` and `selectionReason: "user-override"`.
- In Milestone 1a, overrides may be supplied as an in-memory input parameter. Persistent override storage is not required.
