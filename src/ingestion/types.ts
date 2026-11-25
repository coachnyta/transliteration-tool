import type { DictionaryEntry, Reading } from "../cantonese/types.js";

export interface IngestionManifestFile {
  id: string;
  path: string;
  sha256: string;
}

export interface IngestionManifest {
  source: "rime-cantonese";
  sourceVersion: string;
  files: IngestionManifestFile[];
}

export type IngestionIssueType =
  | "invalid-entry"
  | "duplicate-entry"
  | "conflicting-reading"
  | "invalid-jyutping"
  | "missing-field"
  | "unreadable-line";

export interface IngestionIssue {
  issueId: string;
  fileId: string;
  sourceEntryId: string | null;
  issueType: IngestionIssueType;
  message: string;
  rawLineNumber: number | null;
  rawExcerpt: string | null;
}

export interface IngestionFileReport {
  fileId: string;
  path: string;
  expectedSha256: string;
  actualSha256: string;
  acceptedEntryCount: number;
  rejectedEntryCount: number;
  duplicateEntryCount: number;
}

export interface IngestionTotals {
  rawEntries: number;
  acceptedEntries: number;
  rejectedEntries: number;
  duplicateEntries: number;
  distinctReadings: number;
  mergedReadings: number;
}

export interface IngestionReport {
  source: "rime-cantonese";
  sourceVersion: string;
  manifestPath: string;
  files: IngestionFileReport[];
  totals: IngestionTotals;
  issues: IngestionIssue[];
}

export interface NormalizedDictionary {
  source: "rime-cantonese";
  sourceVersion: string;
  entries: DictionaryEntry[];
}

export interface ParsedRawEntry {
  fileId: string;
  sourceEntryId: string;
  originalText: string;
  traditionalText: string | null;
  simplifiedText: string | null;
  entryType: "character" | "word" | "phrase";
  readings: Reading[];
  priority: number | null;
  rawLineNumber: number;
  rawExcerpt: string;
}

export interface ParseResult {
  entries: ParsedRawEntry[];
  issues: IngestionIssue[];
  rawEntries: number;
  duplicateEntries: number;
}
