import { formatSegments } from "./formatter.js";
import { segmentTitle } from "./segmenter.js";
import type {
  ConversionError,
  ConversionOptions,
  ConversionOutcome,
  ConversionOverride,
  Reading
} from "./types.js";

export function convertCantoneseTitle(input: string, options?: ConversionOptions): ConversionOutcome {
  if (input.length > 100) {
    return error("INPUT_TOO_LONG", "Input exceeds 100 UTF-16 code units.");
  }

  const overrides = options?.overrides ?? [];
  const overlapError = findOverlappingOverride(overrides);
  if (overlapError) return overlapError;

  for (const override of overrides) {
    if (!Number.isInteger(override.startOffset)
      || !Number.isInteger(override.endOffset)
      || override.startOffset < 0
      || override.endOffset <= override.startOffset
      || override.endOffset > input.length
      || typeof override.originalText !== "string") {
      return error("INVALID_OVERRIDE", "Override offsets or original text are invalid.", override.startOffset, override.endOffset);
    }
  }

  const segmented = segmentTitle(input);
  const segments = segmented.map((candidate) => ({ ...candidate.segment }));

  for (const override of overrides) {
    const candidateIndex = segmented.findIndex((candidate) =>
      candidate.segment.startOffset === override.startOffset
      && candidate.segment.endOffset === override.endOffset
    );

    if (candidateIndex < 0) {
      return error("INVALID_OVERRIDE", "Override does not exactly match a segment span.", override.startOffset, override.endOffset);
    }

    const candidate = segmented[candidateIndex];
    if (!candidate) {
      return error("INVALID_OVERRIDE", "Override does not exactly match a segment span.", override.startOffset, override.endOffset);
    }

    const originalText = input.slice(override.startOffset, override.endOffset);
    if (override.originalText !== originalText) {
      return error("INVALID_OVERRIDE", "Override originalText does not match the original input slice.", override.startOffset, override.endOffset);
    }

    if (override.kind === "select-alternative") {
      const selected = candidate.segment.alternatives.find((reading) => reading.id === override.readingId);
      if (!selected) {
        return error("INVALID_OVERRIDE", "The selected alternative is not present in the segment.", override.startOffset, override.endOffset);
      }
      candidate.segment.selectedReading = selected;
      candidate.segment.readingStatus = candidate.segment.alternatives.length > 1 ? "ambiguous" : "resolved";
      candidate.segment.selectionReason = "user-override";
      candidate.segment.userOverride = true;
    } else {
      if (override.reading.source !== "user-override" && override.reading.source !== "manual-entry") {
        return error("INVALID_OVERRIDE", "Replacement reading must use user-override or manual-entry provenance.", override.startOffset, override.endOffset);
      }
      if (!isValidReplacementReading(override.reading)) {
        return error("INVALID_OVERRIDE", "Replacement reading is malformed.", override.startOffset, override.endOffset);
      }

      const identical = candidate.segment.alternatives.find((reading) => reading.jyutping === override.reading.jyutping);
      if (!identical) {
        candidate.segment.alternatives = [...candidate.segment.alternatives, override.reading];
      }

      candidate.segment.selectedReading = override.reading;
      candidate.segment.readingStatus = candidate.segment.alternatives.length > 1 ? "ambiguous" : "resolved";
      candidate.segment.selectionReason = "user-override";
      candidate.segment.userOverride = true;
    }

    segments[candidateIndex] = candidate.segment;
  }

  for (const segment of segments) {
    if (segment.segmentType === "cantonese" && segment.readingStatus === "unresolved") {
      segment.selectedReading = null;
    }
  }

  const formatted = formatSegments(segments);
  const result = {
    id: `conversion-${createStableId(input)}`,
    originalTitle: input,
    normalizedTitle: input,
    segments,
    finalJyutping: formatted.finalJyutping,
    isComplete: formatted.isComplete,
    dictionaryVersion: "fixture-or-ingestion-pending",
    createdAt: new Date().toISOString()
  };

  return { status: "ok", result };
}

export function findOverlappingOverride(overrides: readonly ConversionOverride[]): ConversionOutcome | null {
  const sorted = [...overrides].sort((left, right) => left.startOffset - right.startOffset);
  let previous: ConversionOverride | null = null;

  for (const override of sorted) {
    if (previous && override.startOffset < previous.endOffset) {
      return {
        status: "error",
        error: {
          code: "OVERLAPPING_OVERRIDES",
          message: "Two or more overrides overlap.",
          startOffset: override.startOffset,
          endOffset: override.endOffset
        }
      };
    }
    previous = override;
  }
  return null;
}

function isValidReplacementReading(reading: Reading): boolean {
  if (!reading.jyutping || reading.syllables.length === 0) return false;
  return reading.syllables.every((syllable) =>
    syllable.text.length > 0
    && Number.isInteger(syllable.tone)
    && syllable.tone >= 1
    && syllable.tone <= 6
  );
}

function createStableId(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function error(code: ConversionError["code"], message: string, startOffset?: number, endOffset?: number): ConversionOutcome {
  const conversionError: ConversionError = { code, message };
  if (startOffset !== undefined) conversionError.startOffset = startOffset;
  if (endOffset !== undefined) conversionError.endOffset = endOffset;
  return { status: "error", error: conversionError };
}
