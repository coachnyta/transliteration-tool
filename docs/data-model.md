# Data Model

## Status

Active.

## Purpose

This document defines the complete TypeScript-facing data contract for the Cantonese-to-Jyutping conversion core.

The model separates:

- Input classification (`segmentType`)
- Reading certainty (`readingStatus`)
- Selected pronunciation (`selectedReading`)
- Alternative pronunciations (`alternatives`)
- Reading provenance (`Reading` metadata)

## Primitive types

```ts
type SegmentType = "cantonese" | "passthrough" | "unresolved";

type ReadingStatus = "resolved" | "ambiguous" | "unresolved";

type ReadingSource =
  | "dictionary"
  | "user-override"
  | "manual-entry";

type SelectionReason =
  | "user-override"
  | "dictionary-default"
  | "highest-priority"
  | "stable-source-order"
  | "none";

type EntryType = "character" | "word" | "phrase";

type ConversionErrorCode =
  | "INPUT_TOO_LONG"
  | "INVALID_OVERRIDE"
  | "OVERLAPPING_OVERRIDES";
```

## Reading

A `Reading` represents one distinct candidate pronunciation for a segment.

```ts
interface ReadingProvenance {
  sourceEntryId: string;
  sourceName: string;
  sourceVersion: string;
  priority: number | null;
}

interface Reading {
  id: string;
  jyutping: string;
  syllables: JyutpingSyllable[];
  source: ReadingSource;
  provenance: ReadingProvenance[];
  priority: number | null;
  isDefault: boolean;
  notes?: string;
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | string | Yes | Stable identifier for this reading | Unique within its segment |
| `jyutping` | string | Yes | Tone-number Jyutping for the segment | Valid Jyutping; tone numbers 1–6 |
| `syllables` | JyutpingSyllable[] | Yes | Individual Jyutping syllables | Non-empty |
| `source` | ReadingSource | Yes | Origin of the reading | — |
| `provenance` | ReadingProvenance[] | Conditional | Supporting dictionary provenance records | Required and non-empty when `source` is `dictionary` |
| `priority` | number \| null | Yes | Deterministic ranking value | `null` when the source provides no usable priority or frequency; higher non-null values are more preferred |
| `isDefault` | boolean | Yes | Whether this is the automatically selected default | At most one reading may be `true` |
| `notes` | string | No | Optional explanation | — |

Two dictionary-derived readings represent the same pronunciation when their `jyutping` values are identical. Multiple provenance records supporting the same pronunciation must be merged into one `Reading`; they must not create multiple alternatives.

## JyutpingSyllable

```ts
interface JyutpingSyllable {
  text: string;
  tone: 1 | 2 | 3 | 4 | 5 | 6;
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `text` | string | Yes | Jyutping syllable without tone number | Valid Jyutping syllable structure |
| `tone` | 1–6 | Yes | Jyutping tone number | Integer from 1 through 6 |

The `jyutping` field is the formatted syllable-plus-tone representation, for example `"tin1"`. The `syllables` array preserves the structured breakdown.

## DictionaryEntry

```ts
interface DictionaryEntry {
  id: string;
  source: "rime-cantonese";
  sourceEntryId: string;
  sourceVersion: string;
  entryType: EntryType;
  originalText: string;
  traditionalText: string | null;
  simplifiedText: string | null;
  readings: Reading[];
  priority: number | null;
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | string | Yes | Stable internal identifier | Unique |
| `source` | `"rime-cantonese"` | Yes | Data source | Fixed for Milestone 1a |
| `sourceEntryId` | string | Yes | Upstream or derived source identifier | Non-empty |
| `sourceVersion` | string | Yes | Pinned commit or dataset version | Non-empty |
| `entryType` | EntryType | Yes | Dictionary granularity | — |
| `originalText` | string | Yes | Text as represented in the source | Non-empty |
| `traditionalText` | string \| null | Conditional | Traditional form | Required when applicable |
| `simplifiedText` | string \| null | Conditional | Simplified form | Required when applicable |
| `readings` | Reading[] | Yes | All distinct credible readings | Non-empty |
| `priority` | number \| null | Yes | Deterministic ranking value | `null` when the source provides no usable priority or frequency |

## ConversionOptions

```ts
type ConversionOverride =
  | {
      kind: "select-alternative";
      startOffset: number;
      endOffset: number;
      originalText: string;
      readingId: string;
    }
  | {
      kind: "replace-reading";
      startOffset: number;
      endOffset: number;
      originalText: string;
      reading: Reading;
    };

interface ConversionOptions {
  overrides?: ConversionOverride[];
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `kind` | `"select-alternative" \| "replace-reading"` | Yes | Override operation | — |
| `startOffset` | number | Yes | Inclusive start offset in the original input | UTF-16 code-unit index; >= 0 |
| `endOffset` | number | Yes | Exclusive end offset in the original input | UTF-16 code-unit index; > `startOffset` |
| `originalText` | string | Yes | Exact original text covered by the override | Must equal the input slice between the offsets |
| `readingId` | string | Conditional | Existing alternative to select | Required for `select-alternative`; must match a reading in that segment’s `alternatives` |
| `reading` | Reading | Conditional | Replacement reading | Required for `replace-reading`; must have `source: "user-override"` or `"manual-entry"` |
| `overrides` | ConversionOverride[] | No | In-memory user overrides | Optional |

Override rules:

- `select-alternative` selects an existing dictionary alternative and preserves its dictionary provenance unchanged.
- `replace-reading` supplies a new pronunciation and must use `source: "user-override"` or `"manual-entry"`.
- Both override kinds must match the original input exactly at `startOffset` and `endOffset`.
- `originalText` must equal the input slice between those offsets.
- Overlapping overrides are invalid and cause a validation error.
- A valid override takes precedence over every dictionary match.
- Both override kinds set `userOverride: true` and `selectionReason: "user-override"`.
- An override that does not match the input causes a validation error.

### Replacement reading and alternatives

For a `replace-reading` override:

- The replacement reading becomes `selectedReading`.
- The replacement reading is added to `alternatives` when its Jyutping is distinct from every existing dictionary alternative.
- The replacement reading must not create a duplicate alternative when its Jyutping is identical to an existing dictionary alternative.
- When the replacement Jyutping is identical to an existing dictionary alternative, the existing dictionary alternative remains in `alternatives` with its original dictionary provenance.
- Original dictionary alternatives and their provenance are retained in every case.
- The replacement reading uses `source: "user-override"` or `"manual-entry"` and must not claim dictionary provenance.

## ConversionError and ConversionOutcome

```ts
interface ConversionError {
  code: ConversionErrorCode;
  message: string;
  startOffset?: number;
  endOffset?: number;
}

type ConversionOutcome =
  | { status: "ok"; result: ConversionResult }
  | { status: "error"; error: ConversionError };
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `code` | ConversionErrorCode | Yes | Stable error code | One of the defined codes |
| `message` | string | Yes | Human-readable explanation | Non-empty |
| `startOffset` | number | No | Offset associated with the error, when applicable | UTF-16 code-unit index |
| `endOffset` | number | No | Offset associated with the error, when applicable | UTF-16 code-unit index |
| `status` | `"ok" \| "error"` | Yes | Outcome status | — |
| `result` | ConversionResult | Conditional | Successful conversion result | Required when `status` is `ok` |
| `error` | ConversionError | Conditional | Validation error | Required when `status` is `error` |

Error codes:

| Code | Meaning |
|---|---|
| `INPUT_TOO_LONG` | Input exceeds 100 UTF-16 code units |
| `INVALID_OVERRIDE` | Override offsets or original text do not match the input, or the override references an unavailable reading |
| `OVERLAPPING_OVERRIDES` | Two or more overrides overlap |

## ConversionSegment

```ts
interface ConversionSegment {
  id: string;
  originalText: string;
  startOffset: number;
  endOffset: number;
  segmentType: SegmentType;
  readingStatus: ReadingStatus;
  selectedReading: Reading | null;
  alternatives: Reading[];
  selectionReason: SelectionReason;
  userOverride: boolean;
  notes?: string;
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | string | Yes | Stable identifier for the segment | Unique within a result |
| `originalText` | string | Yes | Exact original text represented by this segment | Non-empty |
| `startOffset` | number | Yes | Start offset in the original input | UTF-16 code-unit index; >= 0 |
| `endOffset` | number | Yes | Exclusive end offset in the original input | UTF-16 code-unit index; > `startOffset` |
| `segmentType` | SegmentType | Yes | Classification of the original text | — |
| `readingStatus` | ReadingStatus | Yes | Certainty of the selected reading | — |
| `selectedReading` | Reading \| null | Conditional | Reading displayed by default | Required when `readingStatus` is `resolved`; optional when `ambiguous`; must be `null` when `unresolved` |
| `alternatives` | Reading[] | Yes | All distinct credible readings, including the selected reading when present | May be empty |
| `selectionReason` | SelectionReason | Conditional | Why `selectedReading` was chosen | Required when `readingStatus` is `resolved` or `ambiguous` |
| `userOverride` | boolean | Yes | Whether the user explicitly selected or changed the reading | Default `false` |
| `notes` | string | No | Optional human-readable explanation | — |

## ConversionResult

```ts
interface ConversionResult {
  id: string;
  originalTitle: string;
  normalizedTitle: string;
  segments: ConversionSegment[];
  finalJyutping: string | null;
  isComplete: boolean;
  dictionaryVersion: string;
  createdAt: string;
}
```

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | string | Yes | Stable identifier for the conversion result | Unique |
| `originalTitle` | string | Yes | Original user input | — |
| `normalizedTitle` | string | Yes | Normalized matching representation | May differ from original only for matching |
| `segments` | ConversionSegment[] | Yes | Ordered conversion segments | Non-empty for non-empty input |
| `finalJyutping` | string \| null | Conditional | Complete tone-number Jyutping | `null` unless every segment is complete |
| `isComplete` | boolean | Yes | Whether a final Jyutping result can be produced | True only when every Cantonese segment has a selected reading, every passthrough segment is resolved, and no segment is `unresolved` |
| `dictionaryVersion` | string | Yes | Dictionary version or commit used | Non-empty |
| `createdAt` | string | Yes | ISO 8601 timestamp | — |

## Offset contract

- All `startOffset` and `endOffset` values refer to the **original, unmodified input string**.
- Offsets use **UTF-16 code units**, matching JavaScript string indexing.
- Normalization must not mutate or replace the original input.
- Normalization may create a separate normalized matching representation, but segment offsets must always map back to the original input.
- Tests must include emoji, supplementary-plane characters, repeated whitespace, and mixed scripts.

## State matrix

| `segmentType` | `readingStatus` | `selectedReading` | Meaning |
|---|---|---|---|
| `cantonese` | `resolved` | Required | One credible reading was found |
| `cantonese` | `ambiguous` | Required in Milestone 1a; `null` is type-legal only for forward compatibility | Multiple distinct credible readings exist; stable source order selects a default |
| `cantonese` | `unresolved` | `null` | No credible reading was found |
| `passthrough` | `resolved` | `null` | Non-Cantonese text intentionally unchanged |
| `unresolved` | `unresolved` | `null` | Text could not be classified or converted |

## Invariants

- A segment with more than one distinct Jyutping pronunciation must have `readingStatus: "ambiguous"`.
- Multiple provenance records with the same Jyutping pronunciation must not create multiple alternatives.
- If `readingStatus` is `resolved`, `selectedReading` must be non-null.
- In Milestone 1a, if `readingStatus` is `ambiguous`, `selectedReading` must be non-null because stable source order always selects a default.
- If `readingStatus` is `unresolved`, then `selectedReading` must be `null`.
- A `passthrough` segment must have `readingStatus: "resolved"`, `selectedReading: null`, and `alternatives: []`.
- A user override must set `userOverride: true` and `selectionReason: "user-override"`.
- A `select-alternative` override must reference a reading already present in `alternatives` and must preserve that reading’s dictionary provenance.
- A `replace-reading` override must use `source: "user-override"` or `"manual-entry"`.
- A distinct replacement reading must be added to `alternatives`.
- A replacement reading with Jyutping identical to an existing dictionary alternative must not create a duplicate alternative; the existing dictionary alternative remains in `alternatives` with its original provenance.
- Original dictionary alternatives and their provenance are retained when a replacement override is applied.
- `finalJyutping` must be `null` if any segment has `segmentType: "unresolved"`, any Cantonese segment has `readingStatus: "unresolved"`, or any Cantonese segment has no selected reading.
- `isComplete` must be `false` if any of those conditions applies.
- Every `Reading` with `source: "dictionary"` must include non-empty `provenance`.
- A `null` priority must not outrank a non-null priority.

## Example: ambiguous Cantonese segment

```json
{
  "id": "segment-3",
  "originalText": "行",
  "segmentType": "cantonese",
  "startOffset": 4,
  "endOffset": 5,
  "readingStatus": "ambiguous",
  "selectedReading": {
    "id": "reading-3a",
    "jyutping": "<validated Jyutping from dictionary>",
    "syllables": [
      {
        "text": "<validated syllable>",
        "tone": 1
      }
    ],
    "source": "dictionary",
    "provenance": [
      {
        "sourceEntryId": "<source entry id>",
        "sourceName": "rime-cantonese",
        "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
        "priority": 100
      }
    ],
    "priority": 100,
    "isDefault": true
  },
  "alternatives": [
    {
      "id": "reading-3a",
      "jyutping": "<validated Jyutping from dictionary>",
      "syllables": [
        {
          "text": "<validated syllable>",
          "tone": 1
        }
      ],
      "source": "dictionary",
      "provenance": [
        {
          "sourceEntryId": "<source entry id>",
          "sourceName": "rime-cantonese",
          "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
          "priority": 100
        }
      ],
      "priority": 100,
      "isDefault": true
    },
    {
      "id": "reading-3b",
      "jyutping": "<validated alternative Jyutping from dictionary>",
      "syllables": [
        {
          "text": "<validated alternative syllable>",
          "tone": 1
        }
      ],
      "source": "dictionary",
      "provenance": [
        {
          "sourceEntryId": "<alternative source entry id>",
          "sourceName": "rime-cantonese",
          "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
          "priority": 80
        }
      ],
      "priority": 80,
      "isDefault": false
    }
  ],
  "selectionReason": "highest-priority",
  "userOverride": false,
  "notes": "Multiple distinct dictionary readings; highest-priority reading selected."
}
```

Do not use placeholder Jyutping values in test fixtures or implementation. Replace them only with values validated against the pinned Rime-Cantonese dataset.
