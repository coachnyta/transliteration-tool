import { parseAllDocuments } from "yaml";
import type { Reading } from "../cantonese/types.js";
import type { IngestionIssue, ParsedRawEntry, ParseResult } from "./types.js";

function issueId(fileId: string, lineNumber: number, type: string, ordinal: number): string {
  return `issue-${fileId}-${String(lineNumber)}-${type}-${String(ordinal)}`;
}

function safeExcerpt(text: string): string {
  const cleaned = text.replace(/\s+/gu, " ").trim();
  return cleaned.length <= 200 ? cleaned : cleaned.slice(0, 197) + "...";
}

export function parseJyutping(jyutping: string): { valid: boolean; reading: string; syllables: { text: string; tone: 1 | 2 | 3 | 4 | 5 | 6 }[] } {
  const trimmed = jyutping.trim();
  const parts = trimmed.split(/\s+/u).filter(Boolean);
  if (!trimmed || parts.length === 0) return { valid: false, reading: trimmed, syllables: [] };

  const syllables: { text: string; tone: 1 | 2 | 3 | 4 | 5 | 6 }[] = [];
  for (const part of parts) {
    const match = /^([a-z]+)([1-6])$/u.exec(part);
    if (!match) return { valid: false, reading: trimmed, syllables: [] };
    syllables.push({ text: match[1] ?? "", tone: Number(match[2]) as 1 | 2 | 3 | 4 | 5 | 6 });
  }

  return { valid: true, reading: parts.join(" "), syllables };
}

function stableReadingId(sourceEntryId: string, jyutping: string): string {
  return `reading-${sourceEntryId}-${jyutping.replace(/[^a-z0-9]+/gu, "-")}`;
}

function asPriority(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/u.test(value.trim())) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

function inferEntryType(originalText: string): "character" | "word" | "phrase" {
  const length = Array.from(originalText).length;
  if (length === 1) return "character";
  if (length <= 4) return "word";
  return "phrase";
}

export function parseRimeDictionary(text: string, fileId: string, sourceVersion: string): ParseResult {
  const entries: ParsedRawEntry[] = [];
  const issues: IngestionIssue[] = [];
  let rawEntries = 0;
  const duplicateEntries = 0;
  let issueOrdinal = 0;

  let structured: unknown[] | null = null;
  try {
    const parsedJson = JSON.parse(text) as unknown;
    if (Array.isArray(parsedJson)) structured = parsedJson;
    else if (typeof parsedJson === "object" && parsedJson !== null) {
      const record = parsedJson as Record<string, unknown>;
      if (Array.isArray(record.entries)) structured = record.entries;
    }
  } catch {
    structured = null;
  }

  if (structured === null) {
    for (const document of parseAllDocuments(text)) {
      const value = document.toJS() as unknown;
      if (Array.isArray(value)) {
        const values = value as unknown[];
        structured = [...(structured ?? []), ...values];
      } else if (typeof value === "object" && value !== null) {
        const record = value as Record<string, unknown>;
        if (Array.isArray(record.entries)) {
          const entries = record.entries as unknown[];
          structured = [...(structured ?? []), ...entries];
        } else if (Object.keys(record).some((key) => ["originalText", "text", "readings", "reading", "jyutping", "sourceEntryId", "id"].includes(key))) {
          structured = [...(structured ?? []), record];
        }
      }
    }
  }

  if (structured !== null) {
    for (const [index, item] of structured.entries()) {
      const lineNumber = index + 1;
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "unreadable-line", issueOrdinal++),
          fileId,
          sourceEntryId: null,
          issueType: "unreadable-line",
          message: "Structured entry is not an object.",
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(JSON.stringify(item))
        });
        rawEntries += 1;
        continue;
      }

      const record = item as Record<string, unknown>;
      const sourceEntryIdValue = record.sourceEntryId ?? record.id;
      const originalTextValue = record.originalText ?? record.text;
      const traditionalTextValue = record.traditionalText ?? record.traditional;
      const simplifiedTextValue = record.simplifiedText ?? record.simplified;
      const entryTypeValue = record.entryType ?? record.type;
      const priorityValue = record.priority ?? record.frequency ?? record.weight;

      rawEntries += 1;
      const sourceEntryId = typeof sourceEntryIdValue === "string" ? sourceEntryIdValue : "";
      const originalText = typeof originalTextValue === "string" ? originalTextValue : "";

      if (!sourceEntryId || !originalText) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "missing-field", issueOrdinal++),
          fileId,
          sourceEntryId: sourceEntryId || null,
          issueType: "missing-field",
          message: "Source entry ID or original text is missing.",
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(JSON.stringify(record))
        });
        continue;
      }

      const entryType = entryTypeValue === "character" || entryTypeValue === "word" || entryTypeValue === "phrase"
        ? entryTypeValue
        : inferEntryType(originalText);

      const readingValues: unknown[] = Array.isArray(record.readings)
        ? record.readings
        : Array.isArray(record.jyutping)
          ? record.jyutping
          : record.readings !== undefined
            ? [record.readings]
            : record.reading !== undefined
              ? [record.reading]
              : record.jyutping !== undefined
                ? [record.jyutping]
                : record.pronunciation !== undefined
                  ? [record.pronunciation]
                  : [];

      const readings: Reading[] = [];
      for (const readingValue of readingValues) {
        const jyutping = typeof readingValue === "object" && readingValue !== null
          ? (readingValue as Record<string, unknown>).jyutping ?? (readingValue as Record<string, unknown>).pronunciation
          : readingValue;
        if (typeof jyutping !== "string") {
          issues.push({
            issueId: issueId(fileId, lineNumber, "missing-field", issueOrdinal++),
            fileId,
            sourceEntryId,
            issueType: "missing-field",
            message: "A reading is missing Jyutping.",
            rawLineNumber: lineNumber,
            rawExcerpt: safeExcerpt(JSON.stringify(record))
          });
          continue;
        }

        const parsed = parseJyutping(jyutping);
        if (!parsed.valid) {
          issues.push({
            issueId: issueId(fileId, lineNumber, "invalid-jyutping", issueOrdinal++),
            fileId,
            sourceEntryId,
            issueType: "invalid-jyutping",
            message: `Invalid Jyutping: ${jyutping}`,
            rawLineNumber: lineNumber,
            rawExcerpt: safeExcerpt(JSON.stringify(record))
          });
          continue;
        }

        const priority = typeof readingValue === "object" && readingValue !== null
          ? asPriority((readingValue as Record<string, unknown>).priority ?? (readingValue as Record<string, unknown>).frequency)
          : asPriority(priorityValue);
        const isDefault = typeof readingValue === "object" && readingValue !== null
          ? (readingValue as Record<string, unknown>).isDefault === true
          : false;

        readings.push({
          id: stableReadingId(sourceEntryId, parsed.reading),
          jyutping: parsed.reading,
          syllables: parsed.syllables,
          source: "dictionary",
          provenance: [{
            sourceEntryId,
            sourceName: "rime-cantonese",
            sourceVersion,
            priority
          }],
          priority,
          isDefault
        });
      }

      if (readings.length === 0) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "invalid-entry", issueOrdinal++),
          fileId,
          sourceEntryId,
          issueType: "invalid-entry",
          message: "Entry has no valid reading.",
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(JSON.stringify(record))
        });
        continue;
      }

      entries.push({
        fileId,
        sourceEntryId,
        originalText,
        traditionalText: typeof traditionalTextValue === "string" ? traditionalTextValue : null,
        simplifiedText: typeof simplifiedTextValue === "string" ? simplifiedTextValue : null,
        entryType,
        readings,
        priority: asPriority(priorityValue),
        rawLineNumber: lineNumber,
        rawExcerpt: safeExcerpt(JSON.stringify(record))
      });
    }
  } else {
    const separatorIndex = text.indexOf("...");
    const body = separatorIndex >= 0 ? text.slice(separatorIndex + 3) : text;

    for (const [bodyIndex, line] of body.split(/\r?\n/u).entries()) {
      const lineNumber = separatorIndex >= 0 ? text.slice(0, separatorIndex + 3).split(/\r?\n/u).length + bodyIndex : bodyIndex + 1;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) continue;

      rawEntries += 1;
      const columns = line.split("\t");
      if (columns.length < 2) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "unreadable-line", issueOrdinal++),
          fileId,
          sourceEntryId: null,
          issueType: "unreadable-line",
          message: "Dictionary line is not tab-separated with text and Jyutping.",
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(line)
        });
        continue;
      }

      const originalText = (columns[0] ?? "").trim();
      const jyutping = (columns[1] ?? "").trim();
      if (!originalText || !jyutping) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "missing-field", issueOrdinal++),
          fileId,
          sourceEntryId: null,
          issueType: "missing-field",
          message: "Original text or Jyutping is missing.",
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(line)
        });
        continue;
      }

      const parsed = parseJyutping(jyutping);
      if (!parsed.valid) {
        issues.push({
          issueId: issueId(fileId, lineNumber, "invalid-jyutping", issueOrdinal++),
          fileId,
          sourceEntryId: null,
          issueType: "invalid-jyutping",
          message: `Invalid Jyutping: ${jyutping}`,
          rawLineNumber: lineNumber,
          rawExcerpt: safeExcerpt(line)
        });
        continue;
      }

      const sourceEntryId = `${fileId}:${String(lineNumber)}`;
      const priority = asPriority(columns[2]);
      entries.push({
        fileId,
        sourceEntryId,
        originalText,
        traditionalText: null,
        simplifiedText: null,
        entryType: inferEntryType(originalText),
        readings: [{
          id: stableReadingId(sourceEntryId, parsed.reading),
          jyutping: parsed.reading,
          syllables: parsed.syllables,
          source: "dictionary",
          provenance: [{ sourceEntryId, sourceName: "rime-cantonese", sourceVersion, priority }],
          priority,
          isDefault: false
        }],
        priority,
        rawLineNumber: lineNumber,
        rawExcerpt: safeExcerpt(line)
      });
    }
  }

  issues.sort((left, right) => left.issueId.localeCompare(right.issueId));
  return { entries, issues, rawEntries, duplicateEntries };
}
