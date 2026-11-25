import { describe, expect, it } from "vitest";
import { validateManifest } from "../../../src/ingestion/manifest.js";

describe("ingestion manifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateManifest({
      source: "rime-cantonese",
      sourceVersion: "test-commit",
      files: [{ id: "chars", path: "chars.dict.yaml", sha256: "a".repeat(64) }]
    });
    expect(result.error).toBeNull();
    expect(result.manifest?.files).toHaveLength(1);
  });

  it("rejects invalid source", () => {
    expect(validateManifest({ source: "other", sourceVersion: "v1", files: [] }).error).toContain("source");
  });

  it("rejects missing sourceVersion", () => {
    expect(validateManifest({ source: "rime-cantonese", files: [] }).error).toContain("sourceVersion");
  });

  it("rejects empty files", () => {
    expect(validateManifest({ source: "rime-cantonese", sourceVersion: "v1", files: [] }).error).toContain("non-empty");
  });

  it("rejects duplicate file IDs", () => {
    const result = validateManifest({
      source: "rime-cantonese",
      sourceVersion: "v1",
      files: [
        { id: "chars", path: "a.yaml", sha256: "a".repeat(64) },
        { id: "chars", path: "b.yaml", sha256: "b".repeat(64) }
      ]
    });
    expect(result.error).toContain("Duplicate manifest file id");
  });

  it("rejects uppercase or malformed SHA-256", () => {
    expect(validateManifest({
      source: "rime-cantonese",
      sourceVersion: "v1",
      files: [{ id: "chars", path: "a.yaml", sha256: "A".repeat(64) }]
    }).error).toContain("SHA-256");
  });
});
