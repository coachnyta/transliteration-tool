import { beforeEach, describe, expect, it } from "vitest";
import { convertCantoneseTitle } from "../../src/cantonese/converter.js";
import { loadDictionary } from "../../src/cantonese/dictionary.js";
import { validFixtureDictionary } from "../fixtures/dictionary/fixture.js";

beforeEach(() => {
  loadDictionary(validFixtureDictionary);
});

describe("conversion pipeline", () => {
  it("converts an exact phrase", () => {
    const outcome = convertCantoneseTitle("香港電影");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments).toHaveLength(1);
      expect(outcome.result.finalJyutping).toBe("hoeng1 gong2 din6 jing2");
      expect(outcome.result.isComplete).toBe(true);
    }
  });

  it("formats Cantonese-English boundaries without punctuation boundaries", () => {
    const mixed = convertCantoneseTitle("中文English中文");
    expect(mixed.status).toBe("ok");
    if (mixed.status === "ok") expect(mixed.result.finalJyutping).toBe("zung1 man4 English zung1 man4");

    const punctuation = convertCantoneseTitle("中文。English");
    expect(punctuation.status).toBe("ok");
    if (punctuation.status === "ok") expect(punctuation.result.finalJyutping).toBe("zung1 man4。English");
  });

  it("handles mixed whitespace and repeated characters", () => {
    const outcome = convertCantoneseTitle("中文  中文");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.originalTitle).toBe("中文  中文");
      expect(outcome.result.finalJyutping).toBe("zung1 man4  zung1 man4");
    }
  });

  it("returns a complete result for ambiguity with a stable default", () => {
    const outcome = convertCantoneseTitle("行");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.segments[0]?.readingStatus).toBe("ambiguous");
      expect(outcome.result.segments[0]?.selectedReading).not.toBeNull();
      expect(outcome.result.isComplete).toBe(true);
    }
  });

  it("returns null final Jyutping for unresolved Cantonese", () => {
    const outcome = convertCantoneseTitle("未");
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.finalJyutping).toBeNull();
      expect(outcome.result.isComplete).toBe(false);
    }
  });
});
