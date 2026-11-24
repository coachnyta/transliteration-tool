export type SegmentType = "cantonese" | "passthrough" | "unresolved";

export type ReadingStatus = "resolved" | "ambiguous" | "unresolved";

export type ReadingSource =
  | "dictionary"
  | "user-override"
  | "manual-entry";

export type SelectionReason =
  | "user-override"
  | "dictionary-default"
  | "highest-priority"
  | "stable-source-order"
  | "none";

export type EntryType = "character" | "word" | "phrase";

export type ConversionErrorCode =
  | "INPUT_TOO_LONG"
  | "INVALID_OVERRIDE"
  | "OVERLAPPING_OVERRIDES";

export interface ReadingProvenance {
  sourceEntryId: string;
  sourceName: string;
  sourceVersion: string;
  priority: number | null;
}

export interface JyutpingSyllable {
  text: string;
  tone: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Reading {
  id: string;
  jyutping: string;
  syllables: JyutpingSyllable[];
  source: ReadingSource;
  provenance: ReadingProvenance[];
  priority: number | null;
  isDefault: boolean;
  notes?: string;
}

export interface DictionaryEntry {
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

export type ConversionOverride =
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

export interface ConversionOptions {
  overrides?: ConversionOverride[];
}

export interface ConversionError {
  code: ConversionErrorCode;
  message: string;
  startOffset?: number;
  endOffset?: number;
}

export type ConversionOutcome =
  | { status: "ok"; result: ConversionResult }
  | { status: "error"; error: ConversionError };

export interface ConversionSegment {
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

export interface ConversionResult {
  id: string;
  originalTitle: string;
  normalizedTitle: string;
  segments: ConversionSegment[];
  finalJyutping: string | null;
  isComplete: boolean;
  dictionaryVersion: string;
  createdAt: string;
}
