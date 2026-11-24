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
```

## Reading

A `Reading` represents one candidate pronunciation for a segment.

```ts
interface Reading {
  id: string;
  jyutping: string;
  syllables: JyutpingSyllable[];
  source: ReadingSource;
  sourceEntryId: string | null;
  sourceName: string | null;
  sourceVersion: string | null;
  priority: number;
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
| `sourceEntryId` | string \| null | Conditional | Dictionary entry identifier | Required when `source` is `dictionary` |
| `sourceName` | string \| null | Conditional | Dictionary source name | Required when `source` is `dictionary` |
| `sourceVersion` | string \| null | Conditional | Dictionary version or commit | Required when `source` is `dictionary` |
| `priority` | number | Yes | Deterministic ranking value | Higher means more preferred |
| `isDefault` | boolean | Yes | Whether this is the automatically selected default | At most one reading may be `true` |
| `notes` | string | No | Optional explanation | — |

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
  priority: number;
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
| `priority` | number | Yes | Deterministic ranking value | Higher means more preferred |

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
| `selectedReading` | Reading \| null | Conditional | Reading displayed by default | Required when `readingStatus` is `resolved` or `ambiguous`; `null` when `unresolved` |
| `alternatives` | Reading[] | Yes | All credible readings, including the selected reading | May be empty |
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
| `finalJyutping` | string \| null | Conditional | Complete tone-number Jyutping | `null` unless every Cantonese segment has a selected reading |
| `isComplete` | boolean | Yes | Whether a final Jyutping result can be produced | True only when no Cantonese segment lacks a selected reading |
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
| `cantonese` | `ambiguous` | Required if deterministic default exists; otherwise `null` | Multiple credible readings exist |
| `cantonese` | `unresolved` | `null` | No credible reading was found |
| `passthrough` | `resolved` | `null` | Non-Cantonese text intentionally unchanged |
| `unresolved` | `unresolved` | `null` | Text could not be classified or converted |

## Invariants

- A segment with `alternatives.length > 1` must have `readingStatus: "ambiguous"`.
- If `readingStatus` is `ambiguous` and `selectedReading` is non-null, then `selectedReading.id` must match exactly one entry in `alternatives`.
- If `readingStatus` is `unresolved`, then `selectedReading` must be `null`.
- A `passthrough` segment must have `readingStatus: "resolved"`, `selectedReading: null`, and `alternatives: []`.
- A user override must set `userOverride: true` and `selectionReason: "user-override"`.
- `finalJyutping` must be `null` if any Cantonese segment has `readingStatus: "unresolved"` or has no selected reading.
- Every `Reading` with `source: "dictionary"` must include `sourceEntryId`, `sourceName`, and `sourceVersion`.

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
    "sourceEntryId": "<source entry id>",
    "sourceName": "rime-cantonese",
    "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
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
      "sourceEntryId": "<source entry id>",
      "sourceName": "rime-cantonese",
      "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
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
      "sourceEntryId": "<alternative source entry id>",
      "sourceName": "rime-cantonese",
      "sourceVersion": "259f0e48bba840c3a2e0d117539e96937f3d89bc",
      "priority": 80,
      "isDefault": false
    }
  ],
  "selectionReason": "highest-priority",
  "userOverride": false,
  "notes": "Multiple dictionary readings; highest-priority reading selected."
}
```

Do not use placeholder Jyutping values in test fixtures or implementation. Replace them only with values validated against the pinned Rime-Cantonese dataset.
