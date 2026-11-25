import { runCli } from "../src/ingestion/cli.js";

const outcome = await runCli(process.argv.slice(2));

if (!outcome.ok) {
  console.error(`Ingestion failed: ${outcome.error}`);
  process.exitCode = 1;
} else {
  console.log(`Ingestion succeeded: ${String(outcome.totals.acceptedEntries)} entries accepted, ${String(outcome.totals.rejectedEntries)} entries rejected.`);
}
