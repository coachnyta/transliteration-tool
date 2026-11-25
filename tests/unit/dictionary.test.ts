import { describe, expect, it } from "vitest";
import {
  clearDictionary,
  findWholeTitlePhrase,
  loadDictionary,
  mergeReadings,
  normalizeDictionaryEntries
} from "../../src/cantonese/dictionary.js";
import { validFixtureDictionary, fixtureDictionary } from "../fixtures/dictionary/fixture.js";

describe("dictionary", () => {
  it("loads valid fixture entries and merges exact duplicates", () => {
    loadDictionary(validFixtureDictionary);
    const normalized = normalizeDictionaryEntries(validFixtureDictionary);
    expect(normalized.find((entry) => entry.originalText === "中")).toBeDefined();
  });

  it("finds exact whole-title phrase matches", () => {
    loadDictionary(validFixtureDictionary);
    expect(findWholeTitlePhrase("香港電影").length).toBeGreaterThan(0);
  });

  it("rejects invalid fixture entries", () => {
    expect(() => normalizeDictionaryEntries(fixtureDictionary)).toThrow(/Invalid dictionary entry/);
  });

  it("merges identical Jyutping pronunciations while retaining provenance", () => {
    loadDictionary(validFixtureDictionary);
    const hongKong = validFixtureDictionary.filter((entry) => entry.originalText === "香港");
    const readings = mergeReadings(hongKong.flatMap((entry) => entry.readings));
    expect(readings).toHaveLength(1);
    expect(readings[0]?.jyutping).toBe("hoeng1 gong2");
    expect(readings[0]?.provenance.length).toBeGreaterThanOrEqual(2);
  });

  it("clears loaded dictionary state", () => {
    clearDictionary();
    expect(findWholeTitlePhrase("香港電影")).toHaveLength(0);
  });
});
