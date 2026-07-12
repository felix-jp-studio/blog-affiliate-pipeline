import { loadConfig } from "./config.js";
import { runPing, runPost } from "./publishOrchestrator.js";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`Usage:
  wp:ping
  wp:post -- --file drafts/article.md [--status draft|publish] [--publish]`);
    process.exit(command ? 0 : 1);
  }

  const config = loadConfig(argv);

  if (command === "ping") {
    await runPing(config);
    return;
  }

  if (command === "post") {
    await runPost(config, argv);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
