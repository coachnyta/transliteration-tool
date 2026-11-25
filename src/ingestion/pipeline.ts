import { readFile, mkdir, writeFile, rm, rename } from "node:fs/promises";
import { dirname, isAbsolute, resolve, join } from "node:path";
import { readManifest, sha256 } from "./manifest.js";
import { parseRimeDictionary } from "./parser.js";
import { normalizeEntries } from "./normalize.js";
import type {
  IngestionFileReport,
  IngestionReport,
  IngestionTotals,
  NormalizedDictionary
} from "./types.js";

export interface IngestionSuccess {
  ok: true;
  dictionaryPath: string;
  reportPath: string;
  totals: IngestionTotals;
}

export interface IngestionFailure {
  ok: false;
  error: string;
}

export type IngestionOutcome = IngestionSuccess | IngestionFailure;

export async function runIngestion(manifestPath: string, outputDirectory: string): Promise<IngestionOutcome> {
  const manifestResult = await readManifest(manifestPath);
  if (!manifestResult.manifest) {
    return { ok: false, error: manifestResult.error ?? "Manifest validation failed." };
  }
  const manifest = manifestResult.manifest;

  const baseDirectory = isAbsolute(manifestPath)
    ? dirname(manifestPath)
    : dirname(resolve(manifestPath));

  const fileRecords: IngestionFileReport[] = [];
  const rawEntriesByFile = new Map<string, number>();
  const rejectedByFile = new Map<string, number>();
  const duplicatesByFile = new Map<string, number>();
  let allParsedEntries: Awaited<ReturnType<typeof parseRimeDictionary>>["entries"] = [];
  let allIssues: Awaited<ReturnType<typeof parseRimeDictionary>>["issues"] = [];
  let rawEntries = 0;

  for (const file of manifest.files) {
    const absolutePath = isAbsolute(file.path)
      ? file.path
      : resolve(baseDirectory, file.path);

    let text: string;
    try {
      text = await readFile(absolutePath, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown file read error.";
      return { ok: false, error: `Unable to read raw file ${file.path}: ${message}` };
    }

    const actualSha256 = sha256(text);
    if (actualSha256 !== file.sha256) {
      return {
        ok: false,
        error: `SHA-256 mismatch for ${file.path}: expected ${file.sha256}, actual ${actualSha256}`
      };
    }

    let parsed;
    try {
      parsed = parseRimeDictionary(text, file.id, manifest.sourceVersion);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error.";
      return { ok: false, error: `Parse failure for ${file.path}: ${message}` };
    }

    allParsedEntries = [...allParsedEntries, ...parsed.entries];
    allIssues = [...allIssues, ...parsed.issues];
    rawEntries += parsed.rawEntries;

    rawEntriesByFile.set(file.id, parsed.rawEntries);
    rejectedByFile.set(
      file.id,
      parsed.issues.filter((issue) => issue.issueType !== "duplicate-entry" && issue.issueType !== "conflicting-reading").length
    );
    duplicatesByFile.set(file.id, parsed.duplicateEntries);
  }

  const normalized = normalizeEntries(allParsedEntries, manifest.sourceVersion, allIssues);

  for (const file of manifest.files) {
    const duplicateCount = normalized.issues.filter((issue) =>
      issue.fileId === file.id && issue.issueType === "duplicate-entry"
    ).length;
    const rejectedCount = rejectedByFile.get(file.id) ?? 0;
    const rawEntryCount = rawEntriesByFile.get(file.id) ?? 0;
    const acceptedCount = Math.max(0, rawEntryCount - rejectedCount - duplicateCount);

    let actualSha256 = "";
    const absolutePath = isAbsolute(file.path)
      ? file.path
      : resolve(baseDirectory, file.path);
    try {
      actualSha256 = sha256(await readFile(absolutePath, "utf8"));
    } catch {
      return { ok: false, error: `Unable to re-read raw file ${file.path}.` };
    }

    fileRecords.push({
      fileId: file.id,
      path: file.path,
      expectedSha256: file.sha256,
      actualSha256,
      acceptedEntryCount: acceptedCount,
      rejectedEntryCount: rejectedCount,
      duplicateEntryCount: duplicateCount
    });
  }

  const totals: IngestionTotals = {
    rawEntries,
    acceptedEntries: normalized.totals.acceptedEntries,
    rejectedEntries: normalized.issues.filter((issue) =>
      issue.issueType === "invalid-entry"
      || issue.issueType === "invalid-jyutping"
      || issue.issueType === "missing-field"
      || issue.issueType === "unreadable-line"
    ).length,
    duplicateEntries: normalized.totals.duplicateEntries,
    distinctReadings: normalized.totals.distinctReadings,
    mergedReadings: normalized.totals.mergedReadings
  };

  const report: IngestionReport = {
    source: "rime-cantonese",
    sourceVersion: manifest.sourceVersion,
    manifestPath,
    files: fileRecords.sort((left, right) => left.fileId.localeCompare(right.fileId)),
    totals,
    issues: normalized.issues
  };

  const dictionary: NormalizedDictionary = normalized.dictionary;
  const absoluteOutputDirectory = resolve(outputDirectory);
  const dictionaryPath = join(absoluteOutputDirectory, "dictionary.json");
  const reportPath = join(absoluteOutputDirectory, "ingestion-report.json");
  const dictionaryTempPath = join(absoluteOutputDirectory, ".dictionary.json.tmp");
  const reportTempPath = join(absoluteOutputDirectory, ".ingestion-report.json.tmp");

  try {
    await mkdir(absoluteOutputDirectory, { recursive: true });
    await writeFile(dictionaryTempPath, JSON.stringify(dictionary, null, 2) + "\n", "utf8");
    await writeFile(reportTempPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    await rename(dictionaryTempPath, dictionaryPath);
    await rename(reportTempPath, reportPath);
  } catch (error) {
    await rm(dictionaryTempPath, { force: true }).catch(() => undefined);
    await rm(reportTempPath, { force: true }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Unknown output write error.";
    return { ok: false, error: `Unable to write ingestion output: ${message}` };
  }

  return { ok: true, dictionaryPath, reportPath, totals };
}
