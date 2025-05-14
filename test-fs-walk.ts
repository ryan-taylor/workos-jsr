// Test importing from @std/fs/walk
import { walk } from "@std/fs/walk";

console.log("Successfully imported walk from @std/fs/walk");

// Test a small usage of walk
async function main() {
  console.log("Walking current directory...");
  for await (const entry of walk(".")) {
    console.log(entry.path);
    // Just print first 5 entries to avoid overwhelming output
    if (entry.path.split("/").length > 5) break;
  }
}

main().catch(console.error);
