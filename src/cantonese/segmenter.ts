import {
  candidateMatchLength,
  findCharacterCandidates,
  findPhraseCandidates,
  findWholeTitlePhrase,
  findWordCandidates,
  mergeCandidateReadings
} from "./dictionary.js";
import { normalizeText } from "./normalize.js";
import type {
  ConversionSegment,
  DictionaryEntry,
  Reading,
  SelectionReason
} from "./types.js";

export interface SegmentedCandidate {
  segment: ConversionSegment;
  dictionaryEntries: DictionaryEntry[];
}

export function selectDefaultReading(readings: readonly Reading[], entries: readonly DictionaryEntry[] = []): { reading: Reading | null; reason: SelectionReason } {
  if (readings.length === 0) return { reading: null, reason: "none" };

  const explicitDefault = readings.find((reading) => reading.isDefault);
  if (explicitDefault) return { reading: explicitDefault, reason: "dictionary-default" };

  const priorityValues = readings
    .map((reading) => reading.priority)
    .filter((priority): priority is number => priority !== null);
  if (priorityValues.length > 0) {
    const highest = Math.max(...priorityValues);
    const highestReading = readings.find((reading) => reading.priority === highest);
    if (highestReading) return { reading: highestReading, reason: "highest-priority" };
  }

  const entryDefault = entries.find((entry) => entry.readings.some((reading) => reading.isDefault));
  if (entryDefault) {
    const defaultReading = entryDefault.readings.find((reading) => reading.isDefault);
    if (defaultReading) return { reading: defaultReading, reason: "dictionary-default" };
  }

  const stable = [...readings].sort((left, right) => {
    if (left.priority !== null && right.priority !== null && left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    if (left.priority !== null && right.priority === null) return -1;
    if (left.priority === null && right.priority !== null) return 1;

    const leftId = left.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
    const rightId = right.provenance.map((item) => item.sourceEntryId).filter(Boolean).sort()[0] ?? "";
    if (leftId !== rightId) return leftId.localeCompare(rightId, "en", { numeric: true });
    return left.id.localeCompare(right.id, "en", { numeric: true });
  });
  return { reading: stable[0] ?? null, reason: "stable-source-order" };
}

export function segmentTitle(input: string): SegmentedCandidate[] {
  const normalized = normalizeText(input);
  const segments: SegmentedCandidate[] = [];
  let offset = 0;

  while (offset < input.length) {
    const classification = normalized.classifications.find((item) => item.startOffset === offset);
    if (!classification) break;

    if (classification.segmentType === "passthrough") {
      let endOffset = offset + classification.endOffset - classification.startOffset;
      while (endOffset < input.length) {
        const next = normalized.classifications.find((item) => item.startOffset === endOffset);
        if (!next || next.segmentType !== "passthrough" || next.category !== classification.category) break;
        endOffset = next.endOffset;
      }
      segments.push(createPassthroughSegment(input, offset, endOffset));
      offset = endOffset;
      continue;
    }

    if (classification.segmentType === "unresolved") {
      let endOffset = classification.endOffset;
      while (endOffset < input.length) {
        const next = normalized.classifications.find((item) => item.startOffset === endOffset);
        if (!next || next.segmentType !== "unresolved") break;
        endOffset = next.endOffset;
      }
      segments.push(createUnresolvedSegment(input, offset, endOffset));
      offset = endOffset;
      continue;
    }

    const exactWholeTitle = segments.length === 0 && findWholeTitlePhrase(normalized.normalizedTitle);
    if (exactWholeTitle && exactWholeTitle.length > 0 && offset === 0) {
      const entries = exactWholeTitle;
      const endOffset = input.length;
      segments.push(createDictionarySegment(input, offset, endOffset, entries));
      offset = endOffset;
      continue;
    }

    const phraseEntries = findPhraseCandidates(normalized.normalizedTitle, offset);
    if (phraseEntries.length > 0) {
      const entries = phraseEntries;
      const length = candidateMatchLength(entries[0] as DictionaryEntry, normalized.normalizedTitle, offset);
      segments.push(createDictionarySegment(input, offset, offset + length, entries));
      offset += length;
      continue;
    }

    const wordEntries = findWordCandidates(normalized.normalizedTitle, offset);
    if (wordEntries.length > 0) {
      const entries = wordEntries;
      const length = candidateMatchLength(entries[0] as DictionaryEntry, normalized.normalizedTitle, offset);
      segments.push(createDictionarySegment(input, offset, offset + length, entries));
      offset += length;
      continue;
    }

    const characterEntries = findCharacterCandidates(normalized.normalizedTitle, offset);
    if (characterEntries.length > 0) {
      const entries = characterEntries;
      const length = candidateMatchLength(entries[0] as DictionaryEntry, normalized.normalizedTitle, offset);
      segments.push(createDictionarySegment(input, offset, offset + length, entries));
      offset += length;
      continue;
    }

    segments.push(createUnresolvedCantoneseSegment(input, offset, classification.endOffset));
    offset = classification.endOffset;
  }

  return segments;
}

function createPassthroughSegment(input: string, startOffset: number, endOffset: number): SegmentedCandidate {
  const segment: ConversionSegment = {
    id: `segment-${String(startOffset + 1)}-${String(endOffset)}`,
    originalText: input.slice(startOffset, endOffset),
    startOffset,
    endOffset,
    segmentType: "passthrough",
    readingStatus: "resolved",
    selectedReading: null,
    alternatives: [],
    selectionReason: "none",
    userOverride: false
  };
  return { segment, dictionaryEntries: [] };
}

function createUnresolvedSegment(input: string, startOffset: number, endOffset: number): SegmentedCandidate {
  const segment: ConversionSegment = {
    id: `segment-${String(startOffset + 1)}-${String(endOffset)}`,
    originalText: input.slice(startOffset, endOffset),
    startOffset,
    endOffset,
    segmentType: "unresolved",
    readingStatus: "unresolved",
    selectedReading: null,
    alternatives: [],
    selectionReason: "none",
    userOverride: false
  };
  return { segment, dictionaryEntries: [] };
}

function createUnresolvedCantoneseSegment(input: string, startOffset: number, endOffset: number): SegmentedCandidate {
  const segment: ConversionSegment = {
    id: `segment-${String(startOffset + 1)}-${String(endOffset)}`,
    originalText: input.slice(startOffset, endOffset),
    startOffset,
    endOffset,
    segmentType: "cantonese",
    readingStatus: "unresolved",
    selectedReading: null,
    alternatives: [],
    selectionReason: "none",
    userOverride: false
  };
  return { segment, dictionaryEntries: [] };
}

function createDictionarySegment(input: string, startOffset: number, endOffset: number, entries: DictionaryEntry[]): SegmentedCandidate {
  const alternatives = mergeCandidateReadings(entries);
  const selection = selectDefaultReading(alternatives, entries);
  const readingStatus = alternatives.length > 1 ? "ambiguous" : "resolved";

  const segment: ConversionSegment = {
    id: `segment-${String(startOffset + 1)}-${String(endOffset)}`,
    originalText: input.slice(startOffset, endOffset),
    startOffset,
    endOffset,
    segmentType: "cantonese",
    readingStatus,
    selectedReading: selection.reading,
    alternatives,
    selectionReason: selection.reason,
    userOverride: false
  };

  return { segment, dictionaryEntries: entries };
}
