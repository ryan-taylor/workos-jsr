#!/usr/bin/env -S deno run --allow-run

/**
 * JSR smoke test script
 *
 * Runs a dry-run publish to check for potential publishing issues
 * Handles known panic "Text changes were overlapping" with a warning
 */

const KNOWN_PUBLISH_PANIC = /Text changes were overlapping/;

async function hasJsrCli(): Promise<boolean> {
  try {
    const p = new Deno.Command("which", { args: ["jsr"], stderr: "piped" })
      .spawn();
    const { code } = await p.output();
    return code === 0;
  } catch {
    return false;
  }
}

async function main() {
  // Check if --show-panics flag is present
  const showPanics = Deno.args.includes("--show-panics");

  // Check if JSR CLI is installed, use it if available
  const useJsrCli = await hasJsrCli();

  const command = useJsrCli ? "jsr" : "deno";
  const args = useJsrCli
    ? ["publish", ".", "--dry-run"]
    : ["publish", "--dry-run"];

  console.log(`Running: ${command} ${args.join(" ")}`);

  const p = new Deno.Command(command, {
    args: args,
    stderr: "piped",
  }).spawn();

  const { code, stderr } = await p.output();
  const err = new TextDecoder().decode(stderr);

  if (code === 0) {
    console.log("✅ JSR dry run publish successful");
    Deno.exit(0);
  }
  if (!showPanics && KNOWN_PUBLISH_PANIC.test(err)) {
    console.error("⚠️  Ignored known Deno panic (see docs/KNOWN_ISSUES.md)");
    Deno.exit(0);
  }

  console.error(err);
  Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
