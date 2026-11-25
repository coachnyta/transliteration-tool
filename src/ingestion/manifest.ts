import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { IngestionManifest } from "./types.js";

export interface ManifestValidationResult {
  manifest: IngestionManifest | null;
  error: string | null;
}

export function validateManifest(value: unknown): ManifestValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { manifest: null, error: "Manifest must be a JSON object." };
  }

  const record = value as Record<string, unknown>;
  if (record.source !== "rime-cantonese") {
    return { manifest: null, error: "Manifest source must be rime-cantonese." };
  }
  if (typeof record.sourceVersion !== "string" || record.sourceVersion.trim().length === 0) {
    return { manifest: null, error: "Manifest sourceVersion must be a non-empty string." };
  }
  if (!Array.isArray(record.files) || record.files.length === 0) {
    return { manifest: null, error: "Manifest files must be a non-empty array." };
  }

  const ids = new Set<string>();
  const files: IngestionManifest["files"] = [];
  for (const [index, item] of record.files.entries()) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { manifest: null, error: `Manifest file at index ${String(index)} must be an object.` };
    }

    const file = item as Record<string, unknown>;
    if (typeof file.id !== "string" || file.id.trim().length === 0) {
      return { manifest: null, error: `Manifest file at index ${String(index)} has an invalid id.` };
    }
    if (ids.has(file.id)) {
      return { manifest: null, error: `Duplicate manifest file id: ${file.id}` };
    }
    ids.add(file.id);

    if (typeof file.path !== "string" || file.path.trim().length === 0) {
      return { manifest: null, error: `Manifest file ${file.id} has an invalid path.` };
    }
    if (typeof file.sha256 !== "string" || !/^([0-9a-f]{64})$/u.test(file.sha256)) {
      return { manifest: null, error: `Manifest file ${file.id} has an invalid SHA-256 value.` };
    }

    files.push({ id: file.id, path: file.path, sha256: file.sha256 });
  }

  return {
    manifest: {
      source: "rime-cantonese",
      sourceVersion: record.sourceVersion,
      files
    },
    error: null
  };
}

export async function readManifest(manifestPath: string): Promise<ManifestValidationResult> {
  let text: string;
  try {
    text = await readFile(manifestPath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown manifest read error.";
    return { manifest: null, error: `Unable to read manifest: ${message}` };
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return { manifest: null, error: "Manifest JSON is invalid." };
  }

  return validateManifest(value);
}

export function sha256(text: string | Uint8Array): string {
  return createHash("sha256").update(text).digest("hex");
}
