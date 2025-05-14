#!/usr/bin/env -S deno run -A

/**
 * WorkOS SDK pre-commit git hook
 *
 * This hook runs before committing changes to ensure code quality.
 * Set SKIP_CODEGEN=1 for faster commits that bypass regenerating the SDK.
 *
 * Usage:
 *   - Normal: git commit -m "commit message"
 *   - Fast: SKIP_CODEGEN=1 git commit -m "commit message"
 */

async function runCommand(cmd: string, args: string[] = []): Promise<boolean> {
  console.log(`Running: ${cmd} ${args.join(" ")}`);

  const command = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    console.error(`Command failed: ${cmd} ${args.join(" ")}`);
    console.error(new TextDecoder().decode(stderr));
    return false;
  }

  return true;
}

async function main() {
  console.log("🪝 Running pre-commit hook...");

  // Check if SKIP_CODEGEN is set
  const skipCodegen = Deno.env.get("SKIP_CODEGEN") === "1";

  if (skipCodegen) {
    console.log("⏩ Skipping code generation (SKIP_CODEGEN=1)");
  } else {
    console.log("🔄 Running code generation checks...");

    // Validate OpenAPI spec checksums
    if (
      !await runCommand("deno", [
        "run",
        "-A",
        "scripts/ci/validate-spec-checksums.ts",
      ])
    ) {
      console.error("❌ OpenAPI spec checksum validation failed");
      Deno.exit(1);
    }

    // Generate SDK code - skippable for faster commits
    if (!await runCommand("deno", ["task", "generate:api"])) {
      console.error("❌ Code generation failed");
      Deno.exit(1);
    }

    console.log("✅ Code generation completed");
  }

  // Always run these basic quality checks
  console.log("🔍 Running basic code quality checks...");

  // Check for syntax errors with deno check
  if (!await runCommand("deno", ["check", "mod.ts"])) {
    console.error("❌ Type checking failed");
    Deno.exit(1);
  }

  // Check for npm: imports in staged files
  console.log("🔍 Checking for npm: imports in staged files...");
  if (
    !await runCommand("deno", [
      "run",
      "-A",
      "scripts/check-no-npm-imports.ts",
      "--staged",
    ])
  ) {
    console.error("❌ npm: imports detected");
    console.error(
      "npm: imports are forbidden as part of our Deno 2.x migration.",
    );
    console.error(
      "Please remove or replace these imports with Deno-compatible alternatives.",
    );
    Deno.exit(1);
  }

  console.log("✅ Pre-commit hook completed successfully");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Pre-commit hook failed:", err);
    Deno.exit(1);
  });
}
