#!/usr/bin/env -S deno run -A
import { ensureDir } from "jsr:@std/fs@^1";
import { join } from "jsr:@std/path@^1";
import { detectAdapter } from "./detect_adapter.ts";
import { postProcess } from "./postprocess/index.ts";
import { validateTemplates } from "./validate-templates.ts";
import { processSpec } from "./postprocess/dereference-spec.ts";
/**
 * Find the latest OpenAPI spec file in the vendor directory.
 * Files are named as workos-YYYY-MM-DD-SHA.json
 */ async function findLatestSpecFile() {
  try {
    const specDir = "./vendor/openapi";
    const entries = [
      ...Deno.readDirSync(specDir)
    ];
    // Filter for proper spec files and extract date information
    const specFiles = entries.filter((entry)=>entry.isFile && entry.name.startsWith("workos-") && entry.name.endsWith(".json") && // Match the expected format with regex
      /workos-\d{4}-\d{2}-\d{2}(-[a-f0-9]+)?(-\w+)?\.json/.test(entry.name)).map((entry)=>{
      const match = entry.name.match(/workos-(\d{4}-\d{2}-\d{2})/);
      const dateStr = match ? match[1] : "0000-00-00";
      return {
        path: join(specDir, entry.name),
        name: entry.name,
        date: dateStr
      };
    });
    if (specFiles.length === 0) {
      throw new Error("No OpenAPI spec files found in vendor/openapi");
    }
    // Sort by date (newest first)
    specFiles.sort((a, b)=>b.date.localeCompare(a.date));
    const latestSpec = specFiles[0];
    console.log(`Found latest spec: ${latestSpec.name}`);
    // Detect the OpenAPI version from the spec file
    const { version } = await detectAdapter(latestSpec.path);
    console.log(`Detected OpenAPI version: ${version}`);
    return {
      filePath: latestSpec.path,
      specVersion: latestSpec.date,
      apiVersion: version
    };
  } catch (error) {
    console.error("Error finding latest spec file:", error);
    throw error;
  }
}
/**
 * Ensure the output directory exists
 */ async function ensureOutputDirectory(outputDir) {
  try {
    await ensureDir(outputDir);
    console.log(`Ensured output directory: ${outputDir}`);
  } catch (error) {
    console.error(`Error creating directory ${outputDir}:`, error);
    throw error;
  }
}
/**
 * Run deno check on the generated code
 */ async function typeCheckGeneratedCode(outputDir) {
  console.log(`Running type check on generated code in ${outputDir}...`);
  try {
    const command = new Deno.Command("deno", {
      args: [
        "check",
        `${outputDir}/**/*.ts`
      ],
      stdout: "piped",
      stderr: "piped"
    });
    const { code, stdout, stderr } = await command.output();
    const outText = new TextDecoder().decode(stdout);
    const errText = new TextDecoder().decode(stderr);
    if (code === 0) {
      console.log("Type check passed!");
    } else {
      console.error("Type check failed with errors:");
      console.error(errText || outText);
      throw new Error("Type check failed");
    }
  } catch (error) {
    console.error("Error during type check:", error);
    throw error;
  }
}
/**
 * Main function to generate code from OpenAPI spec
 */ async function generateCode() {
  try {
    // Find the latest spec file
    const { filePath, specVersion, apiVersion } = await findLatestSpecFile();
    // Process the spec file to normalize and generate post-processed checksum
    console.log("Processing OpenAPI spec to generate post-processed checksum...");
    const { rawChecksum, processedChecksum } = await processSpec(filePath);
    console.log(`Raw checksum: ${rawChecksum}`);
    console.log(`Post-processed checksum: ${processedChecksum}`);
    // Define output directory
    const outputDir = `./packages/workos_sdk/generated/${specVersion}`;
    // Ensure output directory exists
    await ensureOutputDirectory(outputDir);
    console.log(`Generating code from ${filePath} to ${outputDir}...`);
    console.log(`Using OpenAPI version: ${apiVersion}`);
    // Validate templates before code generation
    const templatesDir = "./scripts/codegen/templates";
    console.log(`Validating templates in ${templatesDir}...`);
    const validationResult = await validateTemplates(templatesDir);
    if (!validationResult.valid) {
      console.warn("Template validation failed: missing required templates");
      console.warn(`Missing templates: ${validationResult.missingTemplates.join(", ")}`);
      if (!Deno.args.includes("--force")) {
        console.error("Template validation failed. Use --force to generate anyway.");
        Deno.exit(1);
      }
      console.warn("Continuing with code generation despite missing templates (--force)");
    }
    // Get appropriate generator for the OpenAPI version
    const { adapter: generator } = await detectAdapter(filePath);
    // Generate code using the selected generator
    await generator.generate(filePath, outputDir, {
      useOptions: true,
      useUnionTypes: true,
      templates: templatesDir
    });
    console.log("Code generation complete!");
    // Apply post-processing transforms
    console.log("Applying post-processing transforms...");
    await postProcess(outputDir);
    // Run type check on the generated code
    await typeCheckGeneratedCode(outputDir);
    console.log(`Successfully generated and validated OpenAPI code for version ${specVersion}`);
  } catch (error) {
    console.error("Error generating code:", error);
    Deno.exit(1);
  }
}
// Run the code generation
if (import.meta.main) {
  await generateCode();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL2J1aWxkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IC1TIGRlbm8gcnVuIC1BXG5pbXBvcnQgeyBlbnN1cmVEaXIsIGV4aXN0c1N5bmMgfSBmcm9tIFwianNyOkBzdGQvZnNAXjFcIjtcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBqb2luIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAXjFcIjtcbmltcG9ydCB7IGRldGVjdEFkYXB0ZXIgfSBmcm9tIFwiLi9kZXRlY3RfYWRhcHRlci50c1wiO1xuaW1wb3J0IHsgcG9zdFByb2Nlc3MgfSBmcm9tIFwiLi9wb3N0cHJvY2Vzcy9pbmRleC50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVUZW1wbGF0ZXMgfSBmcm9tIFwiLi92YWxpZGF0ZS10ZW1wbGF0ZXMudHNcIjtcbmltcG9ydCB7IHByb2Nlc3NTcGVjIH0gZnJvbSBcIi4vcG9zdHByb2Nlc3MvZGVyZWZlcmVuY2Utc3BlYy50c1wiO1xuXG4vKipcbiAqIEZpbmQgdGhlIGxhdGVzdCBPcGVuQVBJIHNwZWMgZmlsZSBpbiB0aGUgdmVuZG9yIGRpcmVjdG9yeS5cbiAqIEZpbGVzIGFyZSBuYW1lZCBhcyB3b3Jrb3MtWVlZWS1NTS1ERC1TSEEuanNvblxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kTGF0ZXN0U3BlY0ZpbGUoKTogUHJvbWlzZTx7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIHNwZWNWZXJzaW9uOiBzdHJpbmc7XG4gIGFwaVZlcnNpb246IHN0cmluZztcbn0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzcGVjRGlyID0gXCIuL3ZlbmRvci9vcGVuYXBpXCI7XG4gICAgY29uc3QgZW50cmllcyA9IFsuLi5EZW5vLnJlYWREaXJTeW5jKHNwZWNEaXIpXTtcbiAgICBcbiAgICAvLyBGaWx0ZXIgZm9yIHByb3BlciBzcGVjIGZpbGVzIGFuZCBleHRyYWN0IGRhdGUgaW5mb3JtYXRpb25cbiAgICBjb25zdCBzcGVjRmlsZXMgPSBlbnRyaWVzXG4gICAgICAuZmlsdGVyKChlbnRyeSkgPT4gXG4gICAgICAgIGVudHJ5LmlzRmlsZSAmJiBcbiAgICAgICAgZW50cnkubmFtZS5zdGFydHNXaXRoKFwid29ya29zLVwiKSAmJiBcbiAgICAgICAgZW50cnkubmFtZS5lbmRzV2l0aChcIi5qc29uXCIpICYmXG4gICAgICAgIC8vIE1hdGNoIHRoZSBleHBlY3RlZCBmb3JtYXQgd2l0aCByZWdleFxuICAgICAgICAvd29ya29zLVxcZHs0fS1cXGR7Mn0tXFxkezJ9KC1bYS1mMC05XSspPygtXFx3Kyk/XFwuanNvbi8udGVzdChlbnRyeS5uYW1lKVxuICAgICAgKVxuICAgICAgLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBlbnRyeS5uYW1lLm1hdGNoKC93b3Jrb3MtKFxcZHs0fS1cXGR7Mn0tXFxkezJ9KS8pO1xuICAgICAgICBjb25zdCBkYXRlU3RyID0gbWF0Y2ggPyBtYXRjaFsxXSA6IFwiMDAwMC0wMC0wMFwiO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IGpvaW4oc3BlY0RpciwgZW50cnkubmFtZSksXG4gICAgICAgICAgbmFtZTogZW50cnkubmFtZSxcbiAgICAgICAgICBkYXRlOiBkYXRlU3RyLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgXG4gICAgaWYgKHNwZWNGaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIE9wZW5BUEkgc3BlYyBmaWxlcyBmb3VuZCBpbiB2ZW5kb3Ivb3BlbmFwaVwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gU29ydCBieSBkYXRlIChuZXdlc3QgZmlyc3QpXG4gICAgc3BlY0ZpbGVzLnNvcnQoKGEsIGIpID0+IGIuZGF0ZS5sb2NhbGVDb21wYXJlKGEuZGF0ZSkpO1xuICAgIFxuICAgIGNvbnN0IGxhdGVzdFNwZWMgPSBzcGVjRmlsZXNbMF07XG4gICAgY29uc29sZS5sb2coYEZvdW5kIGxhdGVzdCBzcGVjOiAke2xhdGVzdFNwZWMubmFtZX1gKTtcbiAgICBcbiAgICAvLyBEZXRlY3QgdGhlIE9wZW5BUEkgdmVyc2lvbiBmcm9tIHRoZSBzcGVjIGZpbGVcbiAgICBjb25zdCB7IHZlcnNpb24gfSA9IGF3YWl0IGRldGVjdEFkYXB0ZXIobGF0ZXN0U3BlYy5wYXRoKTtcbiAgICBjb25zb2xlLmxvZyhgRGV0ZWN0ZWQgT3BlbkFQSSB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbGVQYXRoOiBsYXRlc3RTcGVjLnBhdGgsXG4gICAgICBzcGVjVmVyc2lvbjogbGF0ZXN0U3BlYy5kYXRlLFxuICAgICAgYXBpVmVyc2lvbjogdmVyc2lvbixcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmaW5kaW5nIGxhdGVzdCBzcGVjIGZpbGU6XCIsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG4vKipcbiAqIEVuc3VyZSB0aGUgb3V0cHV0IGRpcmVjdG9yeSBleGlzdHNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZW5zdXJlT3V0cHV0RGlyZWN0b3J5KG91dHB1dERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgZW5zdXJlRGlyKG91dHB1dERpcik7XG4gICAgY29uc29sZS5sb2coYEVuc3VyZWQgb3V0cHV0IGRpcmVjdG9yeTogJHtvdXRwdXREaXJ9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgY3JlYXRpbmcgZGlyZWN0b3J5ICR7b3V0cHV0RGlyfTpgLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW4gZGVubyBjaGVjayBvbiB0aGUgZ2VuZXJhdGVkIGNvZGVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gdHlwZUNoZWNrR2VuZXJhdGVkQ29kZShvdXRwdXREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZyhgUnVubmluZyB0eXBlIGNoZWNrIG9uIGdlbmVyYXRlZCBjb2RlIGluICR7b3V0cHV0RGlyfS4uLmApO1xuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IERlbm8uQ29tbWFuZChcImRlbm9cIiwge1xuICAgICAgYXJnczogW1wiY2hlY2tcIiwgYCR7b3V0cHV0RGlyfS8qKi8qLnRzYF0sXG4gICAgICBzdGRvdXQ6IFwicGlwZWRcIixcbiAgICAgIHN0ZGVycjogXCJwaXBlZFwiLFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHsgY29kZSwgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGNvbW1hbmQub3V0cHV0KCk7XG4gICAgXG4gICAgY29uc3Qgb3V0VGV4dCA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShzdGRvdXQpO1xuICAgIGNvbnN0IGVyclRleHQgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoc3RkZXJyKTtcbiAgICBcbiAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coXCJUeXBlIGNoZWNrIHBhc3NlZCFcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUeXBlIGNoZWNrIGZhaWxlZCB3aXRoIGVycm9yczpcIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVyclRleHQgfHwgb3V0VGV4dCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIGNoZWNrIGZhaWxlZFwiKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGR1cmluZyB0eXBlIGNoZWNrOlwiLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWluIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGNvZGUgZnJvbSBPcGVuQVBJIHNwZWNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVDb2RlKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIC8vIEZpbmQgdGhlIGxhdGVzdCBzcGVjIGZpbGVcbiAgICBjb25zdCB7IGZpbGVQYXRoLCBzcGVjVmVyc2lvbiwgYXBpVmVyc2lvbiB9ID0gYXdhaXQgZmluZExhdGVzdFNwZWNGaWxlKCk7XG4gICAgXG4gICAgLy8gUHJvY2VzcyB0aGUgc3BlYyBmaWxlIHRvIG5vcm1hbGl6ZSBhbmQgZ2VuZXJhdGUgcG9zdC1wcm9jZXNzZWQgY2hlY2tzdW1cbiAgICBjb25zb2xlLmxvZyhcIlByb2Nlc3NpbmcgT3BlbkFQSSBzcGVjIHRvIGdlbmVyYXRlIHBvc3QtcHJvY2Vzc2VkIGNoZWNrc3VtLi4uXCIpO1xuICAgIGNvbnN0IHsgcmF3Q2hlY2tzdW0sIHByb2Nlc3NlZENoZWNrc3VtIH0gPSBhd2FpdCBwcm9jZXNzU3BlYyhmaWxlUGF0aCk7XG4gICAgY29uc29sZS5sb2coYFJhdyBjaGVja3N1bTogJHtyYXdDaGVja3N1bX1gKTtcbiAgICBjb25zb2xlLmxvZyhgUG9zdC1wcm9jZXNzZWQgY2hlY2tzdW06ICR7cHJvY2Vzc2VkQ2hlY2tzdW19YCk7XG4gICAgXG4gICAgLy8gRGVmaW5lIG91dHB1dCBkaXJlY3RvcnlcbiAgICBjb25zdCBvdXRwdXREaXIgPSBgLi9wYWNrYWdlcy93b3Jrb3Nfc2RrL2dlbmVyYXRlZC8ke3NwZWNWZXJzaW9ufWA7XG4gICAgXG4gICAgLy8gRW5zdXJlIG91dHB1dCBkaXJlY3RvcnkgZXhpc3RzXG4gICAgYXdhaXQgZW5zdXJlT3V0cHV0RGlyZWN0b3J5KG91dHB1dERpcik7XG4gICAgY29uc29sZS5sb2coYEdlbmVyYXRpbmcgY29kZSBmcm9tICR7ZmlsZVBhdGh9IHRvICR7b3V0cHV0RGlyfS4uLmApO1xuICAgIGNvbnNvbGUubG9nKGBVc2luZyBPcGVuQVBJIHZlcnNpb246ICR7YXBpVmVyc2lvbn1gKTtcbiAgICBcbiAgICAvLyBWYWxpZGF0ZSB0ZW1wbGF0ZXMgYmVmb3JlIGNvZGUgZ2VuZXJhdGlvblxuICAgIGNvbnN0IHRlbXBsYXRlc0RpciA9IFwiLi9zY3JpcHRzL2NvZGVnZW4vdGVtcGxhdGVzXCI7XG4gICAgY29uc29sZS5sb2coYFZhbGlkYXRpbmcgdGVtcGxhdGVzIGluICR7dGVtcGxhdGVzRGlyfS4uLmApO1xuICAgIGNvbnN0IHZhbGlkYXRpb25SZXN1bHQgPSBhd2FpdCB2YWxpZGF0ZVRlbXBsYXRlcyh0ZW1wbGF0ZXNEaXIpO1xuICAgIFxuICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC52YWxpZCkge1xuICAgICAgY29uc29sZS53YXJuKFwiVGVtcGxhdGUgdmFsaWRhdGlvbiBmYWlsZWQ6IG1pc3NpbmcgcmVxdWlyZWQgdGVtcGxhdGVzXCIpO1xuICAgICAgY29uc29sZS53YXJuKGBNaXNzaW5nIHRlbXBsYXRlczogJHt2YWxpZGF0aW9uUmVzdWx0Lm1pc3NpbmdUZW1wbGF0ZXMuam9pbihcIiwgXCIpfWApO1xuICAgICAgaWYgKCFEZW5vLmFyZ3MuaW5jbHVkZXMoXCItLWZvcmNlXCIpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUZW1wbGF0ZSB2YWxpZGF0aW9uIGZhaWxlZC4gVXNlIC0tZm9yY2UgdG8gZ2VuZXJhdGUgYW55d2F5LlwiKTtcbiAgICAgICAgRGVuby5leGl0KDEpO1xuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKFwiQ29udGludWluZyB3aXRoIGNvZGUgZ2VuZXJhdGlvbiBkZXNwaXRlIG1pc3NpbmcgdGVtcGxhdGVzICgtLWZvcmNlKVwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gR2V0IGFwcHJvcHJpYXRlIGdlbmVyYXRvciBmb3IgdGhlIE9wZW5BUEkgdmVyc2lvblxuICAgIGNvbnN0IHsgYWRhcHRlcjogZ2VuZXJhdG9yIH0gPSBhd2FpdCBkZXRlY3RBZGFwdGVyKGZpbGVQYXRoKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBjb2RlIHVzaW5nIHRoZSBzZWxlY3RlZCBnZW5lcmF0b3JcbiAgICBhd2FpdCBnZW5lcmF0b3IuZ2VuZXJhdGUoZmlsZVBhdGgsIG91dHB1dERpciwge1xuICAgICAgdXNlT3B0aW9uczogdHJ1ZSxcbiAgICAgIHVzZVVuaW9uVHlwZXM6IHRydWUsXG4gICAgICB0ZW1wbGF0ZXM6IHRlbXBsYXRlc0RpcixcbiAgICB9KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhcIkNvZGUgZ2VuZXJhdGlvbiBjb21wbGV0ZSFcIik7XG4gICAgXG4gICAgLy8gQXBwbHkgcG9zdC1wcm9jZXNzaW5nIHRyYW5zZm9ybXNcbiAgICBjb25zb2xlLmxvZyhcIkFwcGx5aW5nIHBvc3QtcHJvY2Vzc2luZyB0cmFuc2Zvcm1zLi4uXCIpO1xuICAgIGF3YWl0IHBvc3RQcm9jZXNzKG91dHB1dERpcik7XG4gICAgXG4gICAgLy8gUnVuIHR5cGUgY2hlY2sgb24gdGhlIGdlbmVyYXRlZCBjb2RlXG4gICAgYXdhaXQgdHlwZUNoZWNrR2VuZXJhdGVkQ29kZShvdXRwdXREaXIpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGBTdWNjZXNzZnVsbHkgZ2VuZXJhdGVkIGFuZCB2YWxpZGF0ZWQgT3BlbkFQSSBjb2RlIGZvciB2ZXJzaW9uICR7c3BlY1ZlcnNpb259YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdlbmVyYXRpbmcgY29kZTpcIiwgZXJyb3IpO1xuICAgIERlbm8uZXhpdCgxKTtcbiAgfVxufVxuXG4vLyBSdW4gdGhlIGNvZGUgZ2VuZXJhdGlvblxuaWYgKGltcG9ydC5tZXRhLm1haW4pIHtcbiAgYXdhaXQgZ2VuZXJhdGVDb2RlKCk7XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxTQUFTLFNBQVMsUUFBb0IsaUJBQWlCO0FBQ3ZELFNBQTRCLElBQUksUUFBUSxtQkFBbUI7QUFDM0QsU0FBUyxhQUFhLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVMsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxTQUFTLGlCQUFpQixRQUFRLDBCQUEwQjtB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
// denoCacheMetadata=18427231137854869536,687622270429746179