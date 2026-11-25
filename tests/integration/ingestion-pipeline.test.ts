import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { runCli } from "../../src/ingestion/cli.js";
import { sha256 } from "../../src/ingestion/manifest.js";

const fixtureDirectory = "tests/fixtures/ingestion";
const temporaryDirectory = ".tmp-ingestion-test";

beforeEach(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
  await mkdir(temporaryDirectory, { recursive: true });
});

afterEach(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("ingestion pipeline", () => {
  it("successfully ingests valid offline fixtures", async () => {
    const rawPath = `${fixtureDirectory}/valid.dict.yaml`;
    const raw = await readFile(rawPath, "utf8");
    const manifestPath = `${temporaryDirectory}/manifest.json`;
    await writeFile(manifestPath, JSON.stringify({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "fixture", path: "../tests/fixtures/ingestion/valid.dict.yaml", sha256: sha256(raw) }]
    }), "utf8");

    const outputDirectory = `${temporaryDirectory}/output`;
    const outcome = await runCli([manifestPath, outputDirectory]);
    expect(outcome.ok).toBe(true);

    const dictionaryText = await readFile(`${outputDirectory}/dictionary.json`, "utf8");
    const reportText = await readFile(`${outputDirectory}/ingestion-report.json`, "utf8");
    const dictionary = JSON.parse(dictionaryText) as { entries: unknown[] };
    const report = JSON.parse(reportText) as { totals: Record<string, number> };
    expect(dictionary.entries.length).toBeGreaterThan(0);
    expect(report.totals.rawEntries).toBeGreaterThan(0);
  });

  it("produces byte-identical normalized output on repeated ingestion", async () => {
    const rawPath = `${fixtureDirectory}/valid.dict.yaml`;
    const raw = await readFile(rawPath, "utf8");
    const manifestPath = `${temporaryDirectory}/manifest.json`;
    await writeFile(manifestPath, JSON.stringify({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "fixture", path: "../tests/fixtures/ingestion/valid.dict.yaml", sha256: sha256(raw) }]
    }), "utf8");

    const first = `${temporaryDirectory}/first`;
    const second = `${temporaryDirectory}/second`;
    expect((await runCli([manifestPath, first])).ok).toBe(true);
    expect((await runCli([manifestPath, second])).ok).toBe(true);

    expect(await readFile(`${first}/dictionary.json`, "utf8")).toBe(await readFile(`${second}/dictionary.json`, "utf8"));
    expect(await readFile(`${first}/ingestion-report.json`, "utf8")).toBe(await readFile(`${second}/ingestion-report.json`, "utf8"));
  });

  it("rejects invalid manifest JSON and writes no output", async () => {
    const outcome = await runCli([`${fixtureDirectory}/broken.json`, `${temporaryDirectory}/invalid-output`]);
    expect(outcome.ok).toBe(false);
    await expect(readFile(`${temporaryDirectory}/invalid-output/dictionary.json`, "utf8")).rejects.toBeDefined();
  });

  it("rejects SHA-256 mismatch and writes no output", async () => {
    const manifestPath = `${temporaryDirectory}/mismatch.json`;
    await writeFile(manifestPath, JSON.stringify({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "fixture", path: "../tests/fixtures/ingestion/valid.dict.yaml", sha256: "0".repeat(64) }]
    }), "utf8");

    const outcome = await runCli([manifestPath, `${temporaryDirectory}/mismatch-output`]);
    expect(outcome.ok).toBe(false);
    await expect(readFile(`${temporaryDirectory}/mismatch-output/dictionary.json`, "utf8")).rejects.toBeDefined();
  });

  it("rejects missing raw file and writes no output", async () => {
    const manifestPath = `${temporaryDirectory}/missing.json`;
    await writeFile(manifestPath, JSON.stringify({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "missing", path: "../tests/fixtures/ingestion/missing.dict.yaml", sha256: "a".repeat(64) }]
    }), "utf8");

    const outcome = await runCli([manifestPath, `${temporaryDirectory}/missing-output`]);
    expect(outcome.ok).toBe(false);
    await expect(readFile(`${temporaryDirectory}/missing-output/dictionary.json`, "utf8")).rejects.toBeDefined();
  });

  it("records invalid raw entries in the report", async () => {
    const rawPath = `${fixtureDirectory}/invalid.dict.yaml`;
    const raw = await readFile(rawPath, "utf8");
    const manifestPath = `${temporaryDirectory}/invalid-raw-manifest.json`;
    await writeFile(manifestPath, JSON.stringify({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "invalid", path: "../tests/fixtures/ingestion/invalid.dict.yaml", sha256: sha256(raw) }]
    }), "utf8");

    const outputDirectory = `${temporaryDirectory}/invalid-raw-output`;
    const outcome = await runCli([manifestPath, outputDirectory]);
    expect(outcome.ok).toBe(true);

    const report = JSON.parse(await readFile(`${outputDirectory}/ingestion-report.json`, "utf8")) as { issues: { issueType: string }[] };
    expect(report.issues.some((issue) => issue.issueType === "invalid-jyutping")).toBe(true);
    expect(report.issues.some((issue) => issue.issueType === "missing-field")).toBe(true);
    expect(report.issues.some((issue) => issue.issueType === "unreadable-line")).toBe(true);
  });
});
