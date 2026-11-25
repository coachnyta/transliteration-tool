import type { DictionaryEntry, Reading, ReadingProvenance } from "../cantonese/types.js";
import type { IngestionIssue, IngestionTotals, NormalizedDictionary, ParsedRawEntry } from "./types.js";

function stableIssueId(fileId: string, lineNumber: number, type: string, ordinal: number): string {
  return `issue-${fileId}-${String(lineNumber)}-${type}-${String(ordinal)}`;
}

function mergeProvenance(readings: readonly Reading[]): ReadingProvenance[] {
  const map = new Map<string, ReadingProvenance>();
  for (const reading of readings) {
    for (const item of reading.provenance) {
      map.set(`${item.sourceName}|${item.sourceEntryId}|${item.sourceVersion}|${String(item.priority)}`, item);
    }
  }
  return [...map.values()].sort((left, right) => {
    const idCompare = left.sourceEntryId.localeCompare(right.sourceEntryId, "en", { numeric: true });
    if (idCompare !== 0) return idCompare;
    if (left.sourceVersion !== right.sourceVersion) return left.sourceVersion.localeCompare(right.sourceVersion);
    return String(left.priority).localeCompare(String(right.priority));
  });
}

export function mergeReadingList(readings: readonly Reading[]): { readings: Reading[]; mergedReadings: number } {
  const map = new Map<string, Reading>();
  let mergedReadings = 0;

  for (const reading of readings) {
    const existing = map.get(reading.jyutping);
    if (!existing) {
      map.set(reading.jyutping, {
        ...reading,
        syllables: reading.syllables.map((syllable) => ({ ...syllable })),
        provenance: mergeProvenance([reading])
      });
      continue;
    }

    mergedReadings += 1;
    const combined = mergeProvenance([existing, reading]);
    const priority = existing.priority === null
      ? reading.priority
      : reading.priority === null
        ? existing.priority
        : Math.max(existing.priority, reading.priority);

    map.set(reading.jyutping, {
      ...existing,
      provenance: combined,
      priority,
      isDefault: existing.isDefault || reading.isDefault
    });
  }

  return {
    readings: [...map.values()].sort((left, right) => {
      const leftId = left.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
      const rightId = right.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
      if (left.priority !== null && right.priority === null) return -1;
      if (left.priority === null && right.priority !== null) return 1;
      if (left.priority !== null && right.priority !== null && left.priority !== right.priority) {
        return right.priority - left.priority;
      }
      if (leftId !== rightId) return leftId.localeCompare(rightId, "en", { numeric: true });
      return left.jyutping.localeCompare(right.jyutping);
    }),
    mergedReadings
  };
}

export function normalizeEntries(
  parsedEntries: readonly ParsedRawEntry[],
  sourceVersion: string,
  existingIssues: readonly IngestionIssue[]
): { dictionary: NormalizedDictionary; issues: IngestionIssue[]; totals: Pick<IngestionTotals, "acceptedEntries" | "duplicateEntries" | "distinctReadings" | "mergedReadings"> } {
  const issues = [...existingIssues];
  const identityMap = new Map<string, ParsedRawEntry>();
  let duplicateEntries = 0;
  let conflictOrdinal = 0;

  for (const entry of parsedEntries) {
    const readingKey = [...entry.readings]
      .map((reading) => reading.jyutping)
      .sort((left, right) => left.localeCompare(right))
      .join("|");
    const identity = `${entry.sourceEntryId}|${entry.originalText}|${entry.entryType}|${readingKey}`;

    const existing = identityMap.get(identity);
    if (existing) {
      duplicateEntries += 1;
      issues.push({
        issueId: stableIssueId(entry.fileId, entry.rawLineNumber, "duplicate-entry", duplicateEntries),
        fileId: entry.fileId,
        sourceEntryId: entry.sourceEntryId,
        issueType: "duplicate-entry",
        message: "Exact duplicate entry collapsed.",
        rawLineNumber: entry.rawLineNumber,
        rawExcerpt: entry.rawExcerpt
      });
      continue;
    }

    identityMap.set(identity, entry);
  }

  const accepted = [...identityMap.values()].sort((left, right) => {
    const textCompare = left.originalText.localeCompare(right.originalText, "en", { numeric: true });
    if (textCompare !== 0) return textCompare;
    const typeCompare = left.entryType.localeCompare(right.entryType);
    if (typeCompare !== 0) return typeCompare;
    return left.sourceEntryId.localeCompare(right.sourceEntryId, "en", { numeric: true });
  });

  const textReadings = new Map<string, Set<string>>();
  for (const entry of accepted) {
    const key = `${entry.entryType}|${entry.originalText}`;
    const readings = textReadings.get(key) ?? new Set<string>();
    for (const reading of entry.readings) readings.add(reading.jyutping);
    textReadings.set(key, readings);
  }

  for (const entry of accepted) {
    const key = `${entry.entryType}|${entry.originalText}`;
    const distinct = textReadings.get(key);
    if (distinct && distinct.size > 1) {
      issues.push({
        issueId: stableIssueId(entry.fileId, entry.rawLineNumber, "conflicting-reading", conflictOrdinal++),
        fileId: entry.fileId,
        sourceEntryId: entry.sourceEntryId,
        issueType: "conflicting-reading",
        message: `Same text has distinct Jyutping readings: ${[...distinct].sort().join(", ")}`,
        rawLineNumber: entry.rawLineNumber,
        rawExcerpt: entry.rawExcerpt
      });
    }
  }

  const entries: DictionaryEntry[] = [];
  let distinctReadings = 0;
  let mergedReadings = 0;

  const groups = new Map<string, ParsedRawEntry[]>();
  for (const entry of accepted) {
    const key = `${entry.entryType}|${entry.originalText}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const sortedGroups = [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0], "en", { numeric: true }));
  for (const [, group] of sortedGroups) {
    const first = group[0];
    if (!first) continue;

    const sourceEntryIds = group.map((entry) => entry.sourceEntryId).sort((left, right) => left.localeCompare(right, "en", { numeric: true }));
    const sourceEntryId = sourceEntryIds[0] ?? first.sourceEntryId;
    const merged = mergeReadingList(group.flatMap((entry) => entry.readings));
    distinctReadings += merged.readings.length;
    mergedReadings += merged.mergedReadings;

    const priorities = group.map((entry) => entry.priority).filter((priority): priority is number => priority !== null);
    const priority = priorities.length > 0 ? Math.max(...priorities) : null;

    entries.push({
      id: `dictionary-${sourceEntryId}`,
      source: "rime-cantonese",
      sourceEntryId,
      sourceVersion,
      entryType: first.entryType,
      originalText: first.originalText,
      traditionalText: first.traditionalText,
      simplifiedText: first.simplifiedText,
      readings: merged.readings,
      priority
    });
  }

  issues.sort((left, right) => {
    const issueCompare = left.issueId.localeCompare(right.issueId);
    if (issueCompare !== 0) return issueCompare;
    return (left.rawExcerpt ?? "").localeCompare(right.rawExcerpt ?? "");
  });

  return {
    dictionary: {
      source: "rime-cantonese",
      sourceVersion,
      entries
    },
    issues,
    totals: {
      acceptedEntries: entries.length,
      duplicateEntries,
      distinctReadings,
      mergedReadings
    }
  };
}
