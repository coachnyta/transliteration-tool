import type { ConversionSegment } from "./types.js";

export function formatJyutping(reading: { jyutping: string }): string {
  return reading.jyutping.trim().split(/\s+/u).filter(Boolean).join(" ");
}

export function isAlphanumericPassthrough(segment: ConversionSegment): boolean {
  if (segment.segmentType !== "passthrough") return false;
  return /^[A-Za-z0-9]+$/u.test(segment.originalText);
}

export function formatSegments(segments: readonly ConversionSegment[]): {
  finalJyutping: string | null;
  isComplete: boolean;
} {
  let output = "";

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) continue;

    if (segment.segmentType === "passthrough") {
      const previous = segments[index - 1];
      if (previous?.segmentType === "cantonese"
        && isAlphanumericPassthrough(segment)
        && previous.endOffset === segment.startOffset
        && output.length > 0) {
        output += " ";
      }
      output += segment.originalText;
      continue;
    }

    if (segment.segmentType === "unresolved") {
      output += segment.originalText;
      continue;
    }

    if (segment.readingStatus === "unresolved" || segment.selectedReading === null) {
      output += segment.originalText;
      continue;
    }

    const previous = segments[index - 1];
    if (previous?.segmentType === "passthrough"
      && isAlphanumericPassthrough(previous)
      && previous.endOffset === segment.startOffset
      && output.length > 0
      && !output.endsWith(" ")) {
      output += " ";
    }

    output += formatJyutping(segment.selectedReading);
  }

  const isComplete = segments.every((segment) => {
    if (segment.segmentType === "unresolved") return false;
    if (segment.segmentType === "passthrough") return segment.readingStatus === "resolved";
    return segment.readingStatus !== "unresolved" && segment.selectedReading !== null;
  });

  return { finalJyutping: isComplete ? output : null, isComplete };
}
