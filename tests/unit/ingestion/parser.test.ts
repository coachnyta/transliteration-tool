import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseRimeDictionary, parseJyutping } from "../../../src/ingestion/parser.js";

const fixtureDirectory = "tests/fixtures/ingestion";

describe("ingestion parser", () => {
  it("parses valid character, word, phrase, and multi-reading entries", async () => {
    const text = await readFile(`${fixtureDirectory}/valid.dict.yaml`, "utf8");
    const result = parseRimeDictionary(text, "chars", "test-commit");
    expect(result.entries.some((entry) => entry.entryType === "character")).toBe(true);
    expect(result.entries.some((entry) => entry.entryType === "word")).toBe(true);
    expect(result.entries.some((entry) => entry.entryType === "phrase")).toBe(true);
    expect(result.entries.find((entry) => entry.originalText === "行")?.readings).toHaveLength(2);
  });

  it("validates Jyutping tones and syllables", () => {
    expect(parseJyutping("zung1 man4").valid).toBe(true);
    expect(parseJyutping("hou7").valid).toBe(false);
    expect(parseJyutping("not-jyutping").valid).toBe(false);
  });

  it("records missing fields, invalid Jyutping, and unreadable entries", async () => {
    const text = await readFile(`${fixtureDirectory}/invalid.dict.yaml`, "utf8");
    const result = parseRimeDictionary(text, "invalid", "test-commit");
    expect(result.issues.some((issue) => issue.issueType === "invalid-jyutping")).toBe(true);
    expect(result.issues.some((issue) => issue.issueType === "missing-field")).toBe(true);
    expect(result.issues.some((issue) => issue.issueType === "unreadable-line")).toBe(true);
  });

  it("preserves Traditional and Simplified text variants", () => {
    const text = JSON.stringify([{ sourceEntryId: "traditional", text: "繁體", traditionalText: "繁體", simplifiedText: "繁体", readings: ["faan4 tai2"] }]);
    const result = parseRimeDictionary(text, "trad", "test-commit");
    expect(result.entries[0]?.traditionalText).toBe("繁體");
    expect(result.entries[0]?.simplifiedText).toBe("繁体");
  });

  it("supports unreadable tab-separated lines", () => {
    const text = "中\tzung1\nmalformed line\n好\thou7\n";
    const result = parseRimeDictionary(text, "tab", "test-commit");
    expect(result.issues.some((issue) => issue.issueType === "unreadable-line")).toBe(true);
    expect(result.issues.some((issue) => issue.issueType === "invalid-jyutping")).toBe(true);
  });
});
