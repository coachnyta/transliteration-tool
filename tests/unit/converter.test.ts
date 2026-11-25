import { beforeEach, describe, expect, it } from "vitest";
import { convertCantoneseTitle } from "../../src/cantonese/converter.js";
import { loadDictionary } from "../../src/cantonese/dictionary.js";
import type { Reading } from "../../src/cantonese/types.js";
import { validFixtureDictionary } from "../fixtures/dictionary/fixture.js";

beforeEach(() => {
  loadDictionary(validFixtureDictionary);
});

function replacement(jyutping: string, source: "user-override" | "manual-entry" = "user-override"): Reading {
  return {
    id: `replacement-${jyutping}`,
    jyutping,
    syllables: jyutping.split(/\s+/u).map((text) => ({ text: text.slice(0, -1), tone: Number(text.slice(-1)) as 1 | 2 | 3 | 4 | 5 | 6 })),
    source,
    provenance: [],
    priority: null,
    isDefault: false
  };
}

describe("converter", () => {
  it("returns INPUT_TOO_LONG for more than 100 UTF-16 code units", () => {
    const outcome = convertCantoneseTitle("中".repeat(101));
    expect(outcome.status).toBe("error");
    if (outcome.status === "error") expect(outcome.error.code).toBe("INPUT_TOO_LONG");
  });

  it("rejects mismatched override offsets and text", () => {
    const outcome = convertCantoneseTitle("中文", { overrides: [{ kind: "select-alternative", startOffset: 0, endOffset: 1, originalText: "文", readingId: "missing" }] });
    expect(outcome.status).toBe("error");
    if (outcome.status === "error") expect(outcome.error.code).toBe("INVALID_OVERRIDE");
  });

  it("rejects overlapping overrides", () => {
    const outcome = convertCantoneseTitle("中文", { overrides: [
      { kind: "replace-reading", startOffset: 0, endOffset: 2, originalText: "中文", reading: replacement("zung1 man4") },
      { kind: "replace-reading", startOffset: 1, endOffset: 2, originalText: "文", reading: replacement("man4") }
    ] });
    expect(outcome.status).toBe("error");
    if (outcome.status === "error") expect(outcome.error.code).toBe("OVERLAPPING_OVERRIDES");
  });

  it("selects an existing alternative and preserves provenance", () => {
    const outcome = convertCantoneseTitle("行", { overrides: [{ kind: "select-alternative", startOffset: 0, endOffset: 1, originalText: "行", readingId: "r-行-haang6" }] });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments[0]?.selectedReading?.jyutping).toBe("haang6");
      expect(outcome.result.segments[0]?.userOverride).toBe(true);
      expect(outcome.result.segments[0]?.selectionReason).toBe("user-override");
      expect(outcome.result.segments[0]?.selectedReading?.source).toBe("dictionary");
    }
  });

  it("adds a distinct replacement reading", () => {
    const outcome = convertCantoneseTitle("行", { overrides: [{ kind: "replace-reading", startOffset: 0, endOffset: 1, originalText: "行", reading: replacement("gon1") }] });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments[0]?.alternatives.some((reading) => reading.jyutping === "gon1")).toBe(true);
      expect(outcome.result.segments[0]?.selectedReading?.source).toBe("user-override");
    }
  });

  it("does not duplicate an identical replacement alternative", () => {
    const outcome = convertCantoneseTitle("行", { overrides: [{ kind: "replace-reading", startOffset: 0, endOffset: 1, originalText: "行", reading: replacement("hang4") }] });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments[0]?.alternatives.filter((reading) => reading.jyutping === "hang4")).toHaveLength(1);
      expect(outcome.result.segments[0]?.alternatives.find((reading) => reading.jyutping === "hang4")?.source).toBe("dictionary");
      expect(outcome.result.segments[0]?.selectedReading?.source).toBe("user-override");
    }
  });

  it("marks unsupported scripts unresolved and preserves passthrough", () => {
    const outcome = convertCantoneseTitle("中文English한국어");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.finalJyutping).toBeNull();
      expect(outcome.result.isComplete).toBe(false);
      expect(outcome.result.segments.some((segment) => segment.segmentType === "unresolved")).toBe(true);
    }
  });

  it("preserves no-character-loss for emoji and supplementary offsets", () => {
    const outcome = convertCantoneseTitle("中😀文");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments.map((segment) => segment.originalText).join("")).toBe("中😀文");
      expect(outcome.result.segments.map((segment) => [segment.startOffset, segment.endOffset])).toEqual([[0, 1], [1, 3], [3, 4]]);
    }
  });
});
