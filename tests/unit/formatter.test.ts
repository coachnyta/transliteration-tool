import { describe, expect, it } from "vitest";
import { formatSegments } from "../../src/cantonese/formatter.js";
import type { ConversionSegment, Reading } from "../../src/cantonese/types.js";

function reading(jyutping: string): Reading {
  return {
    id: `reading-${jyutping}`,
    jyutping,
    syllables: jyutping.split(/\s+/u).map((text) => ({ text: text.slice(0, -1), tone: Number(text.slice(-1)) as 1 | 2 | 3 | 4 | 5 | 6 })),
    source: "dictionary",
    provenance: [{ sourceEntryId: "fixture", sourceName: "rime-cantonese", sourceVersion: "fixture", priority: null }],
    priority: null,
    isDefault: true
  };
}

function cantonese(text: string, startOffset: number, jyutping = "zung1"): ConversionSegment {
  return { id: `c-${String(startOffset)}`, originalText: text, startOffset, endOffset: startOffset + text.length, segmentType: "cantonese", readingStatus: "resolved", selectedReading: reading(jyutping), alternatives: [reading(jyutping)], selectionReason: "stable-source-order", userOverride: false };
}

function passthrough(text: string, startOffset: number): ConversionSegment {
  return { id: `p-${String(startOffset)}`, originalText: text, startOffset, endOffset: startOffset + text.length, segmentType: "passthrough", readingStatus: "resolved", selectedReading: null, alternatives: [], selectionReason: "none", userOverride: false };
}

describe("formatter", () => {
  it("adds exactly one boundary space for Cantonese directly adjacent to English", () => {
    expect(formatSegments([cantonese("中", 0), passthrough("English", 1), cantonese("文", 8, "man4")]).finalJyutping).toBe("zung1 English man4");
  });

  it("does not add spaces across punctuation boundaries", () => {
    expect(formatSegments([cantonese("中", 0), passthrough("。", 1), passthrough("English", 2)]).finalJyutping).toBe("zung1。English");
  });

  it("preserves existing whitespace", () => {
    expect(formatSegments([cantonese("中", 0), passthrough(" English ", 1), cantonese("文", 11, "man4")]).finalJyutping).toBe("zung1 English man4");
  });

  it("returns null when unresolved", () => {
    const unresolved: ConversionSegment = { id: "u", originalText: "未", startOffset: 0, endOffset: 1, segmentType: "cantonese", readingStatus: "unresolved", selectedReading: null, alternatives: [], selectionReason: "none", userOverride: false };
    expect(formatSegments([unresolved])).toEqual({ finalJyutping: null, isComplete: false });
  });
});
