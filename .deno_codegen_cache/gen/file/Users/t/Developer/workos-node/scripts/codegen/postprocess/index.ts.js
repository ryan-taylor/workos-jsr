#!/usr/bin/env -S deno run -A --reload
// deno-lint-ignore-file
import { walk } from "jsr:@std/fs@^1";
// Lazy load deno_ast only when needed to avoid linter complaints about uncached remote imports.
let denoAst = null;
async function getDenoAst() {
  if (denoAst === null) {
    // Ensure Deno permissions allow remote imports with --allow-net flag
    denoAst = await import("https://deno.land/x/deno_ast@0.46.7/mod.ts");
  }
  if (denoAst === null) {
    throw new Error("Failed to load deno_ast module");
  }
  return denoAst;
}
import { enumUnionTransform } from "./transforms/enum-union-transform.ts";
import { largeBrandedEnumTransform } from "./enums.ts";
/**
 * Parse TypeScript code with deno_ast
 * @param sourceText The source code text to parse
 * @returns The parsed AST or null if parsing failed
 */ export async function parseTypeScript(sourceText) {
  try {
    const { parse } = await getDenoAst();
    return parse(sourceText, {
      syntax: "typescript",
      tsx: false,
    });
  } catch (error) {
    console.error("Error parsing TypeScript:", error);
    return null;
  }
}
/**
 * Post-process generated code
 * @param inputDir Directory containing the generated code
 * @param options Configuration options
 */ export async function postProcess(inputDir, options = {}) {
  const {
    transforms = [
      enumUnionTransform,
      largeBrandedEnumTransform,
    ],
    formatCode = true,
  } = options;
  console.log(`Post-processing generated code in ${inputDir}...`);
  // Add all TypeScript files in the input directory
  const files = [];
  for await (
    const entry of walk(inputDir, {
      includeDirs: false,
      exts: [
        ".ts",
      ],
      followSymlinks: false,
    })
  ) {
    files.push(entry.path);
  }
  if (files.length === 0) {
    console.warn(`No TypeScript files found in ${inputDir}`);
    return;
  }
  console.log(`Found ${files.length} TypeScript files to process`);
  // Process files one by one
  let changesMade = false;
  for (const file of files) {
    try {
      const sourceText = await Deno.readTextFile(file);
      let modifiedSource = sourceText;
      let fileChanged = false;
      // Apply transforms sequentially
      for (const transform of transforms) {
        const result = await transform.process(modifiedSource, file);
        if (result !== null) {
          modifiedSource = result;
          fileChanged = true;
        }
      }
      // Save changes for this file if needed
      if (fileChanged) {
        await Deno.writeTextFile(file, modifiedSource);
        changesMade = true;
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  // Format code if requested and changes were made
  if (changesMade && formatCode) {
    console.log("Formatting code...");
    await formatGeneratedCode(inputDir);
    console.log("Post-processing complete");
  } else if (changesMade) {
    console.log("Post-processing complete");
  } else {
    console.log("No changes made during post-processing");
  }
}
/**
 * Format generated code using deno fmt
 * @param inputDir Directory containing the code to format
 */ async function formatGeneratedCode(inputDir) {
  try {
    const command = new Deno.Command("deno", {
      args: [
        "fmt",
        inputDir,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await command.output();
    if (code !== 0) {
      const errText = new TextDecoder().decode(stderr);
      console.error("Error formatting code:", errText);
    }
  } catch (error) {
    console.error("Failed to run formatter:", error);
  }
}
/**
 * Main function to run post-processing
 */ async function main() {
  // Check for arguments
  if (Deno.args.length < 1) {
    console.error("Usage: deno run -A postprocess.ts <input-directory>");
    Deno.exit(1);
  }
  const inputDir = Deno.args[0];
  await postProcess(inputDir);
}
// Run the script if executed directly
if (import.meta.main) {
  await main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL3Bvc3Rwcm9jZXNzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IC1TIGRlbm8gcnVuIC1BIC0tcmVsb2FkXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGVcblxuaW1wb3J0IHsgd2FsayB9IGZyb20gXCJqc3I6QHN0ZC9mc0BeMVwiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQF4xXCI7XG4vLyBMYXp5IGxvYWQgZGVub19hc3Qgb25seSB3aGVuIG5lZWRlZCB0byBhdm9pZCBsaW50ZXIgY29tcGxhaW50cyBhYm91dCB1bmNhY2hlZCByZW1vdGUgaW1wb3J0cy5cbmxldCBkZW5vQXN0OiB7IHBhcnNlOiAoc3JjOiBzdHJpbmcsIG9wdHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB1bmtub3duIH0gfCBudWxsID0gbnVsbDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVub0FzdCgpOiBQcm9taXNlPHsgcGFyc2U6IChzcmM6IHN0cmluZywgb3B0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHVua25vd24gfT4ge1xuICBpZiAoZGVub0FzdCA9PT0gbnVsbCkge1xuICAgIC8vIEVuc3VyZSBEZW5vIHBlcm1pc3Npb25zIGFsbG93IHJlbW90ZSBpbXBvcnRzIHdpdGggLS1hbGxvdy1uZXQgZmxhZ1xuICAgIGRlbm9Bc3QgPSBhd2FpdCBpbXBvcnQoXCJodHRwczovL2Rlbm8ubGFuZC94L2Rlbm9fYXN0QDAuNDYuNy9tb2QudHNcIik7XG4gIH1cbiAgaWYgKGRlbm9Bc3QgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGRlbm9fYXN0IG1vZHVsZScpO1xuICB9XG4gIHJldHVybiBkZW5vQXN0O1xufVxuaW1wb3J0IHsgZW51bVVuaW9uVHJhbnNmb3JtIH0gZnJvbSBcIi4vdHJhbnNmb3Jtcy9lbnVtLXVuaW9uLXRyYW5zZm9ybS50c1wiO1xuaW1wb3J0IHsgbGFyZ2VCcmFuZGVkRW51bVRyYW5zZm9ybSB9IGZyb20gXCIuL2VudW1zLnRzXCI7XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBjb2RlIHRyYW5zZm9ybXMgXG4gKi9cbi8qKlxuICogSW50ZXJmYWNlIGZvciBjb2RlIHRyYW5zZm9ybXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb2RlVHJhbnNmb3JtIHtcbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBUeXBlU2NyaXB0IGZpbGVcbiAgICogQHBhcmFtIHNvdXJjZVRleHQgVGhlIGNvbnRlbnQgb2YgdGhlIHNvdXJjZSBmaWxlXG4gICAqIEBwYXJhbSBmaWxlUGF0aCBUaGUgcGF0aCB0byB0aGUgZmlsZSB0byB0cmFuc2Zvcm1cbiAgICogQHJldHVybnMgTW9kaWZpZWQgc291cmNlIGlmIGNoYW5nZXMgd2VyZSBtYWRlLCBudWxsIG90aGVyd2lzZVxuICAgKi9cbiAgcHJvY2Vzcyhzb3VyY2VUZXh0OiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xufVxuXG4vKipcbiAqIFBvc3QtcHJvY2Vzc2luZyBvcHRpb25zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9zdFByb2Nlc3NPcHRpb25zIHtcbiAgLyoqXG4gICAqIExpc3Qgb2YgdHJhbnNmb3JtcyB0byBhcHBseVxuICAgKi9cbiAgdHJhbnNmb3Jtcz86IENvZGVUcmFuc2Zvcm1bXTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gZm9ybWF0IHRoZSBjb2RlIGFmdGVyIHRyYW5zZm9ybWF0aW9uXG4gICAqL1xuICBmb3JtYXRDb2RlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQYXJzZSBUeXBlU2NyaXB0IGNvZGUgd2l0aCBkZW5vX2FzdFxuICogQHBhcmFtIHNvdXJjZVRleHQgVGhlIHNvdXJjZSBjb2RlIHRleHQgdG8gcGFyc2VcbiAqIEByZXR1cm5zIFRoZSBwYXJzZWQgQVNUIG9yIG51bGwgaWYgcGFyc2luZyBmYWlsZWRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlVHlwZVNjcmlwdChzb3VyY2VUZXh0OiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHBhcnNlIH0gPSBhd2FpdCBnZXREZW5vQXN0KCk7XG4gICAgcmV0dXJuIHBhcnNlKHNvdXJjZVRleHQsIHtcbiAgICAgIHN5bnRheDogXCJ0eXBlc2NyaXB0XCIsXG4gICAgICB0c3g6IGZhbHNlLCAvLyBTZXQgdG8gdHJ1ZSBpZiBwYXJzaW5nIFRTWFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwYXJzaW5nIFR5cGVTY3JpcHQ6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFBvc3QtcHJvY2VzcyBnZW5lcmF0ZWQgY29kZVxuICogQHBhcmFtIGlucHV0RGlyIERpcmVjdG9yeSBjb250YWluaW5nIHRoZSBnZW5lcmF0ZWQgY29kZVxuICogQHBhcmFtIG9wdGlvbnMgQ29uZmlndXJhdGlvbiBvcHRpb25zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwb3N0UHJvY2VzcyhcbiAgaW5wdXREaXI6IHN0cmluZyxcbiAgb3B0aW9uczogUG9zdFByb2Nlc3NPcHRpb25zID0ge30sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qge1xuICAgIHRyYW5zZm9ybXMgPSBbZW51bVVuaW9uVHJhbnNmb3JtLCBsYXJnZUJyYW5kZWRFbnVtVHJhbnNmb3JtXSxcbiAgICBmb3JtYXRDb2RlID0gdHJ1ZSxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc29sZS5sb2coYFBvc3QtcHJvY2Vzc2luZyBnZW5lcmF0ZWQgY29kZSBpbiAke2lucHV0RGlyfS4uLmApO1xuXG4gIC8vIEFkZCBhbGwgVHlwZVNjcmlwdCBmaWxlcyBpbiB0aGUgaW5wdXQgZGlyZWN0b3J5XG4gIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIHdhbGsoaW5wdXREaXIsIHtcbiAgICBpbmNsdWRlRGlyczogZmFsc2UsXG4gICAgZXh0czogW1wiLnRzXCJdLFxuICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZSxcbiAgfSkpIHtcbiAgICBmaWxlcy5wdXNoKGVudHJ5LnBhdGgpO1xuICB9XG5cbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnNvbGUud2FybihgTm8gVHlwZVNjcmlwdCBmaWxlcyBmb3VuZCBpbiAke2lucHV0RGlyfWApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBGb3VuZCAke2ZpbGVzLmxlbmd0aH0gVHlwZVNjcmlwdCBmaWxlcyB0byBwcm9jZXNzYCk7XG5cbiAgLy8gUHJvY2VzcyBmaWxlcyBvbmUgYnkgb25lXG4gIGxldCBjaGFuZ2VzTWFkZSA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc291cmNlVGV4dCA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKGZpbGUpO1xuICAgICAgbGV0IG1vZGlmaWVkU291cmNlID0gc291cmNlVGV4dDtcbiAgICAgIGxldCBmaWxlQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgICAvLyBBcHBseSB0cmFuc2Zvcm1zIHNlcXVlbnRpYWxseVxuICAgICAgZm9yIChjb25zdCB0cmFuc2Zvcm0gb2YgdHJhbnNmb3Jtcykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0cmFuc2Zvcm0ucHJvY2Vzcyhtb2RpZmllZFNvdXJjZSwgZmlsZSk7XG4gICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICBtb2RpZmllZFNvdXJjZSA9IHJlc3VsdDtcbiAgICAgICAgICBmaWxlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2F2ZSBjaGFuZ2VzIGZvciB0aGlzIGZpbGUgaWYgbmVlZGVkXG4gICAgICBpZiAoZmlsZUNoYW5nZWQpIHtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKGZpbGUsIG1vZGlmaWVkU291cmNlKTtcbiAgICAgICAgY2hhbmdlc01hZGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIGZpbGUgJHtmaWxlfTpgLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gRm9ybWF0IGNvZGUgaWYgcmVxdWVzdGVkIGFuZCBjaGFuZ2VzIHdlcmUgbWFkZVxuICBpZiAoY2hhbmdlc01hZGUgJiYgZm9ybWF0Q29kZSkge1xuICAgIGNvbnNvbGUubG9nKFwiRm9ybWF0dGluZyBjb2RlLi4uXCIpO1xuICAgIGF3YWl0IGZvcm1hdEdlbmVyYXRlZENvZGUoaW5wdXREaXIpO1xuICAgIGNvbnNvbGUubG9nKFwiUG9zdC1wcm9jZXNzaW5nIGNvbXBsZXRlXCIpO1xuICB9IGVsc2UgaWYgKGNoYW5nZXNNYWRlKSB7XG4gICAgY29uc29sZS5sb2coXCJQb3N0LXByb2Nlc3NpbmcgY29tcGxldGVcIik7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coXCJObyBjaGFuZ2VzIG1hZGUgZHVyaW5nIHBvc3QtcHJvY2Vzc2luZ1wiKTtcbiAgfVxufVxuXG4vKipcbiAqIEZvcm1hdCBnZW5lcmF0ZWQgY29kZSB1c2luZyBkZW5vIGZtdFxuICogQHBhcmFtIGlucHV0RGlyIERpcmVjdG9yeSBjb250YWluaW5nIHRoZSBjb2RlIHRvIGZvcm1hdFxuICovXG5hc3luYyBmdW5jdGlvbiBmb3JtYXRHZW5lcmF0ZWRDb2RlKGlucHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IERlbm8uQ29tbWFuZChcImRlbm9cIiwge1xuICAgICAgYXJnczogW1wiZm10XCIsIGlucHV0RGlyXSxcbiAgICAgIHN0ZG91dDogXCJwaXBlZFwiLFxuICAgICAgc3RkZXJyOiBcInBpcGVkXCIsXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgeyBjb2RlLCBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgY29tbWFuZC5vdXRwdXQoKTtcbiAgICBcbiAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgY29uc3QgZXJyVGV4dCA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShzdGRlcnIpO1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZvcm1hdHRpbmcgY29kZTpcIiwgZXJyVGV4dCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcnVuIGZvcm1hdHRlcjpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICogTWFpbiBmdW5jdGlvbiB0byBydW4gcG9zdC1wcm9jZXNzaW5nXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIC8vIENoZWNrIGZvciBhcmd1bWVudHNcbiAgaWYgKERlbm8uYXJncy5sZW5ndGggPCAxKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlVzYWdlOiBkZW5vIHJ1biAtQSBwb3N0cHJvY2Vzcy50cyA8aW5wdXQtZGlyZWN0b3J5PlwiKTtcbiAgICBEZW5vLmV4aXQoMSk7XG4gIH1cbiAgXG4gIGNvbnN0IGlucHV0RGlyID0gRGVuby5hcmdzWzBdO1xuICBhd2FpdCBwb3N0UHJvY2VzcyhpbnB1dERpcik7XG59XG5cbi8vIFJ1biB0aGUgc2NyaXB0IGlmIGV4ZWN1dGVkIGRpcmVjdGx5XG5pZiAoaW1wb3J0Lm1ldGEubWFpbikge1xuICBhd2FpdCBtYWluKCk7XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSx3QkFBd0I7QUFFeEIsU0FBUyxJQUFJLFFBQVEsaUJBQWlCO0FBRXRDLGdHQUFnRztBQUNoRyxJQUFJLFVBQXFGO0FBRXpGLGVBQWU7RUFDYixJQUFJLFlBQVksTUFBTTtJQUNw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
// denoCacheMetadata=5682095483391462594,8144196026088182533
