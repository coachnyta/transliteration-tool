import { describe, expect, it } from "vitest";
import { classifyCharacter, normalizeText } from "../../src/cantonese/normalize.js";

describe("normalizeText", () => {
  it("preserves original input and records UTF-16 offsets", () => {
    const input = "中😀文";
    const result = normalizeText(input);
    expect(result.originalTitle).toBe(input);
    expect(result.normalizedTitle).toBe(input);
    expect(result.classifications.map((item) => [item.startOffset, item.endOffset])).toEqual([[0, 1], [1, 3], [3, 4]]);
  });

  it("classifies Latin, digits, punctuation, whitespace, Han, and unsupported scripts", () => {
    expect(classifyCharacter("A").segmentType).toBe("passthrough");
    expect(classifyCharacter("1").segmentType).toBe("passthrough");
    expect(classifyCharacter("。").segmentType).toBe("passthrough");
    expect(classifyCharacter(" ").segmentType).toBe("passthrough");
    expect(classifyCharacter("中").segmentType).toBe("cantonese");
    expect(classifyCharacter("한").segmentType).toBe("unresolved");
  });

  it("treats emoji as passthrough text", () => {
    expect(normalizeText("😃").classifications[0]?.segmentType).toBe("passthrough");
  });
});
