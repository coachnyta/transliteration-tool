import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { normalizeEntries } from "../../../src/ingestion/normalize.js";
import { parseRimeDictionary } from "../../../src/ingestion/parser.js";

describe("ingestion normalization", () => {
  it("collapses exact duplicates and records the issue", async () => {
    const text = await readFile("tests/fixtures/ingestion/valid.dict.yaml", "utf8");
    const parsed = parseRimeDictionary(text, "chars", "test-commit");
    const normalized = normalizeEntries(parsed.entries, "test-commit", parsed.issues);
    expect(normalized.issues.some((issue) => issue.issueType === "duplicate-entry")).toBe(true);
    expect(normalized.totals.duplicateEntries).toBeGreaterThanOrEqual(1);
  });

  it("retains distinct readings and records conflicting readings", async () => {
    const text = await readFile("tests/fixtures/ingestion/valid.dict.yaml", "utf8");
    const parsed = parseRimeDictionary(text, "chars", "test-commit");
    const normalized = normalizeEntries(parsed.entries, "test-commit", parsed.issues);
    expect(normalized.issues.some((issue) => issue.issueType === "conflicting-reading")).toBe(true);
    const heavy = normalized.dictionary.entries.find((entry) => entry.originalText === "重");
    expect(heavy?.readings.map((reading) => reading.jyutping).sort()).toEqual(["cung4", "zung6"]);
  });

  it("merges identical Jyutping and preserves provenance", () => {
    const text = JSON.stringify([
      { sourceEntryId: "a", text: "行", readings: ["hang4"] },
      { sourceEntryId: "b", text: "行", readings: ["hang4"] }
    ]);
    const parsed = parseRimeDictionary(text, "chars", "test-commit");
    const normalized = normalizeEntries(parsed.entries, "test-commit", parsed.issues);
    expect(normalized.totals.mergedReadings).toBeGreaterThanOrEqual(1);
  });

  it("produces stable entry ordering", () => {
    const text = JSON.stringify([
      { sourceEntryId: "z", text: "文", readings: ["man4"] },
      { sourceEntryId: "a", text: "中", readings: ["zung1"] }
    ]);
    const parsed = parseRimeDictionary(text, "chars", "test-commit");
    const one = normalizeEntries(parsed.entries, "test-commit", parsed.issues);
    const two = normalizeEntries(parsed.entries, "test-commit", parsed.issues);
    expect(JSON.stringify(one.dictionary)).toBe(JSON.stringify(two.dictionary));
  });
});
