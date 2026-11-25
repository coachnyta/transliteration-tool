import { beforeEach, describe, expect, it } from "vitest";
import { loadDictionary } from "../../src/cantonese/dictionary.js";
import { segmentTitle, selectDefaultReading } from "../../src/cantonese/segmenter.js";
import { validFixtureDictionary } from "../fixtures/dictionary/fixture.js";

beforeEach(() => {
  loadDictionary(validFixtureDictionary);
});

describe("segmenter", () => {
  it("uses exact whole-title phrase precedence", () => {
    const segments = segmentTitle("香港電影");
    expect(segments).toHaveLength(1);
    expect(segments[0]?.segment.originalText).toBe("香港電影");
  });

  it("uses word matches before character fallback", () => {
    const segments = segmentTitle("中文");
    expect(segments[0]?.segment.originalText).toBe("中文");
  });

  it("uses character fallback for unmatched Cantonese text", () => {
    const segments = segmentTitle("中英");
    expect(segments).toHaveLength(2);
  });

  it("marks unsupported scripts unresolved", () => {
    const segments = segmentTitle("한국어");
    expect(segments[0]?.segment.segmentType).toBe("unresolved");
  });

  it("preserves offsets around emoji and supplementary characters", () => {
    const segments = segmentTitle("中😀文");
    expect(segments.map((item) => [item.segment.startOffset, item.segment.endOffset])).toEqual([[0, 1], [1, 3], [3, 4]]);
  });

  it("selects an ambiguous reading by stable source order or priority", () => {
    const segments = segmentTitle("行");
    expect(segments[0]?.segment.readingStatus).toBe("ambiguous");
    expect(segments[0]?.segment.selectedReading).not.toBeNull();
    expect(segments[0]?.segment.selectionReason).toBe("dictionary-default");
  });

  it("returns no reading for unresolved Cantonese", () => {
    const segments = segmentTitle("未");
    expect(segments[0]?.segment.readingStatus).toBe("unresolved");
    expect(segments[0]?.segment.selectedReading).toBeNull();
  });

  it("uses stable-source-order selection when priorities are absent", () => {
    const result = selectDefaultReading([
      { id: "b", jyutping: "b1", syllables: [{ text: "b", tone: 1 }], source: "dictionary", provenance: [{ sourceEntryId: "b", sourceName: "rime-cantonese", sourceVersion: "fixture", priority: null }], priority: null, isDefault: false },
      { id: "a", jyutping: "a1", syllables: [{ text: "a", tone: 1 }], source: "dictionary", provenance: [{ sourceEntryId: "a", sourceName: "rime-cantonese", sourceVersion: "fixture", priority: null }], priority: null, isDefault: false }
    ]);
    expect(result.reason).toBe("stable-source-order");
  });
});
