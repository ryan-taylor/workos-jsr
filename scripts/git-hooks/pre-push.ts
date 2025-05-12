#!/usr/bin/env -S deno run -A

/**
 * WorkOS SDK pre-push git hook
 * 
 * This hook runs before pushing changes to ensure full code quality.
 * Unlike pre-commit, this hook always runs all checks to ensure
 * code is fully verified before pushing to the remote repository.
 * 
 * Usage:
 *   git push
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
  console.log("🪝 Running pre-push hook...");
  
  // Always run full checks before pushing
  
  console.log("🔄 Validating OpenAPI spec checksums...");
  if (!await runCommand("deno", ["run", "-A", "scripts/ci/validate-spec-checksums.ts"])) {
    console.error("❌ OpenAPI spec checksum validation failed");
    Deno.exit(1);
  }
  
  console.log("🔄 Generating SDK code...");
  if (!await runCommand("deno", ["task", "generate:api"])) {
    console.error("❌ Code generation failed");
    Deno.exit(1);
  }
  
  console.log("🔍 Running linting checks...");
  if (!await runCommand("deno", ["lint"])) {
    console.error("❌ Linting failed");
    Deno.exit(1);
  }
  
  console.log("🔍 Running type checking...");
  if (!await runCommand("deno", ["check", "$(git ls-files '*.ts')"])) {
    console.error("❌ Type checking failed");
    Deno.exit(1);
  }
  
  console.log("🧪 Running tests...");
  if (!await runCommand("deno", ["test", "-A"])) {
    console.error("❌ Tests failed");
    Deno.exit(1);
  }
  
  console.log("✅ Pre-push hook completed successfully");
}

if (import.meta.main) {
  main().catch(err => {
    console.error("❌ Pre-push hook failed:", err);
    Deno.exit(1);
  });
}