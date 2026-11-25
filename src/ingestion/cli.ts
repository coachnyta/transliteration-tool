import type { IngestionOutcome } from "./pipeline.js";
import { runIngestion } from "./pipeline.js";

export async function runCli(args: readonly string[]): Promise<IngestionOutcome> {
  if (args.length !== 2) {
    return { ok: false, error: "Usage: npm run ingest:data -- <manifest-path> <output-directory>" };
  }

  const manifestPath = args[0];
  const outputDirectory = args[1];
  if (!manifestPath || !outputDirectory) {
    return { ok: false, error: "Usage: npm run ingest:data -- <manifest-path> <output-directory>" };
  }

  return runIngestion(manifestPath, outputDirectory);
}
