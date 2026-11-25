import type { DictionaryEntry, Reading, ReadingProvenance } from "./types.js";

let dictionaryEntries: DictionaryEntry[] = [];

export function loadDictionary(entries: readonly DictionaryEntry[]): void {
  dictionaryEntries = normalizeDictionaryEntries(entries);
}

export function setDictionary(entries: readonly DictionaryEntry[]): void {
  loadDictionary(entries);
}

export function getDictionary(): DictionaryEntry[] {
  return dictionaryEntries.map((entry) => ({
    ...entry,
    readings: entry.readings.map((reading) => ({
      ...reading,
      syllables: reading.syllables.map((syllable) => ({ ...syllable })),
      provenance: reading.provenance.map((provenance) => ({ ...provenance }))
    }))
  }));
}

export function clearDictionary(): void {
  dictionaryEntries = [];
}

export function mergeReadings(readings: readonly Reading[]): Reading[] {
  const merged = new Map<string, Reading>();

  for (const reading of readings) {
    const existing = merged.get(reading.jyutping);
    if (!existing) {
      merged.set(reading.jyutping, {
        ...reading,
        syllables: reading.syllables.map((syllable) => ({ ...syllable })),
        provenance: reading.provenance.map((provenance) => ({ ...provenance }))
      });
      continue;
    }

    const provenance = new Map<string, ReadingProvenance>();
    for (const item of [...existing.provenance, ...reading.provenance]) {
      provenance.set(`${item.sourceName}|${item.sourceEntryId}|${item.sourceVersion}|${String(item.priority)}`, item);
    }

    const priority = existing.priority === null
      ? reading.priority
      : reading.priority === null
        ? existing.priority
        : Math.max(existing.priority, reading.priority);

    merged.set(reading.jyutping, {
      ...existing,
      provenance: [...provenance.values()],
      priority,
      isDefault: existing.isDefault || reading.isDefault
    });
  }

  return [...merged.values()].sort(compareReadingsForStableOrder);
}

export function normalizeDictionaryEntries(entries: readonly DictionaryEntry[]): DictionaryEntry[] {
  const byIdentity = new Map<string, DictionaryEntry>();

  for (const [index, entry] of entries.entries()) {
    if (!entry.sourceEntryId
      || !entry.originalText
      || entry.readings.length === 0
      || entry.readings.some((reading) =>
        !reading.jyutping
        || reading.syllables.length === 0
        || reading.syllables.some((syllable) => syllable.tone < 1 || syllable.tone > 6)
      )) {
      throw new Error("Invalid dictionary entry at index " + String(index));
    }

    const readingKey = [...entry.readings]
      .sort((left, right) => left.jyutping.localeCompare(right.jyutping, "en"))
      .map((reading) => reading.jyutping)
      .join("|");
    const identity = `${entry.sourceEntryId}|${entry.originalText}|${entry.entryType}|${readingKey}`;

    const existing = byIdentity.get(identity);
    if (existing) {
      existing.readings = mergeReadings([...existing.readings, ...entry.readings]);
      continue;
    }

    byIdentity.set(identity, {
      ...entry,
      readings: mergeReadings(entry.readings),
      traditionalText: entry.traditionalText,
      simplifiedText: entry.simplifiedText,
      id: entry.id
    });
  }

  return [...byIdentity.values()].sort((left, right) => compareEntries(left, right));
}

export function entryMatchesText(entry: DictionaryEntry, text: string): boolean {
  return entry.originalText === text
    || entry.traditionalText === text
    || entry.simplifiedText === text;
}

export function findWholeTitlePhrase(normalizedTitle: string): DictionaryEntry[] {
  return dictionaryEntries.filter((entry) =>
    entry.entryType === "phrase" && entryMatchesText(entry, normalizedTitle)
  );
}

export function findPhraseCandidates(normalizedTitle: string, offset: number): DictionaryEntry[] {
  return findCandidatesAtOffset("phrase", normalizedTitle, offset);
}

export function findWordCandidates(normalizedTitle: string, offset: number): DictionaryEntry[] {
  return findCandidatesAtOffset("word", normalizedTitle, offset);
}

export function findCharacterCandidates(normalizedTitle: string, offset: number): DictionaryEntry[] {
  return findCandidatesAtOffset("character", normalizedTitle, offset);
}

export function findLongestCandidates(entries: readonly DictionaryEntry[], normalizedTitle: string, offset: number): DictionaryEntry[] {
  let longest = 0;
  for (const entry of entries) {
    for (const text of entryTexts(entry)) {
      if (normalizedTitle.startsWith(text, offset)) {
        longest = Math.max(longest, text.length);
      }
    }
  }
  if (longest === 0) return [];

  const matches = entries.filter((entry) =>
    entryTexts(entry).some((text) => text.length === longest && normalizedTitle.startsWith(text, offset))
  );
  return matches.sort(compareEntries);
}

function findCandidatesAtOffset(entryType: DictionaryEntry["entryType"], text: string, offset: number): DictionaryEntry[] {
  return findLongestCandidates(
    dictionaryEntries.filter((entry) => entry.entryType === entryType),
    text,
    offset
  );
}

export function candidateMatchLength(entry: DictionaryEntry, text: string, offset: number): number {
  let longest = 0;
  for (const candidate of entryTexts(entry)) {
    if (text.startsWith(candidate, offset)) longest = Math.max(longest, candidate.length);
  }
  return longest;
}

export function entryTexts(entry: DictionaryEntry): string[] {
  return [...new Set([entry.originalText, entry.traditionalText, entry.simplifiedText].filter((text): text is string => text !== null))];
}

export function mergeCandidateReadings(entries: readonly DictionaryEntry[]): Reading[] {
  return mergeReadings(entries.flatMap((entry) => entry.readings));
}

export function compareEntries(left: DictionaryEntry, right: DictionaryEntry): number {
  if (left.priority !== null && right.priority !== null && left.priority !== right.priority) {
    return right.priority - left.priority;
  }
  if (left.priority !== null && right.priority === null) return -1;
  if (left.priority === null && right.priority !== null) return 1;

  const leftId = left.sourceEntryId;
  const rightId = right.sourceEntryId;
  if (leftId && rightId && leftId !== rightId) return leftId.localeCompare(rightId, "en", { numeric: true });
  if (leftId && !rightId) return -1;
  if (!leftId && rightId) return 1;
  return left.id.localeCompare(right.id, "en", { numeric: true });
}

function compareReadingsForStableOrder(left: Reading, right: Reading): number {
  if (left.priority !== null && right.priority !== null && left.priority !== right.priority) {
    return right.priority - left.priority;
  }
  if (left.priority !== null && right.priority === null) return -1;
  if (left.priority === null && right.priority !== null) return 1;

  const leftId = left.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
  const rightId = right.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
  if (leftId !== rightId) return leftId.localeCompare(rightId, "en", { numeric: true });
  return left.id.localeCompare(right.id, "en", { numeric: true });
}
