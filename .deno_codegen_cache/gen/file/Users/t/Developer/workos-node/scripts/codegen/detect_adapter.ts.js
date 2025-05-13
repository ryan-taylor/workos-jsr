#!/usr/bin/env -S deno run -A
/**
 * OpenAPI Adapter Detection Script
 * 
 * This standalone script provides automatic detection of OpenAPI versions
 * and selects the appropriate generator adapter. It can be used by:
 * - Build process
 * - CI workflows
 * - Pre-commit hooks
 * - Upgrade scripts
 * 
 * Usage:
 *   import { detectAdapter } from "./scripts/codegen/detect_adapter.ts";
 *   const { version, adapter } = await detectAdapter("path/to/spec.json");
 */ import { FallbackMode, getFallbackModeFromEnv, getGenerator } from "./adapter.ts";
/**
 * Extracts the OpenAPI version from a specification file
 * 
 * @param specPath Path to the OpenAPI specification file
 * @returns The detected version and dialect information
 */ export async function extractOpenApiVersion(specPath) {
  try {
    const content = await Deno.readTextFile(specPath);
    const spec = JSON.parse(content);
    // Get dialect from custom extension or from openapi/swagger field
    let dialect = spec["x-openapi-dialect"] || "";
    let version = "";
    if (!dialect) {
      // Try to extract from standard fields
      if (spec.openapi) {
        version = spec.openapi;
        dialect = `https://spec.openapis.org/dialect/${version}`;
      } else if (spec.swagger) {
        version = spec.swagger;
        dialect = `https://spec.openapis.org/dialect/${version}`;
      } else {
        version = "unknown";
        dialect = "unknown";
      }
    } else {
      // Extract version from dialect URL if possible
      const versionMatch = dialect.match(/\/([0-9]+\.[0-9]+)/);
      version = versionMatch ? versionMatch[1] : "unknown";
    }
    // Parse version components
    const versionParts = version.split(".");
    const majorVersion = parseInt(versionParts[0]) || 0;
    const minorVersion = parseInt(versionParts[1]) || 0;
    return {
      version,
      dialect,
      majorVersion,
      minorVersion
    };
  } catch (error) {
    console.error(`Error extracting OpenAPI version from ${specPath}:`, error);
    throw error;
  }
}
/**
 * Detects the appropriate adapter for an OpenAPI specification file
 *
 * @param specPath Path to the OpenAPI specification file
 * @param fallbackMode Optional fallback mode, defaults to environment variable setting
 * @returns Detection result with version info and appropriate adapter
 */ export async function detectAdapter(specPath, fallbackMode) {
  // Extract the OpenAPI version from the spec file
  const { version, majorVersion, minorVersion, dialect } = await extractOpenApiVersion(specPath);
  // Use provided fallback mode or get from environment
  const effectiveFallbackMode = fallbackMode || getFallbackModeFromEnv();
  try {
    // Get the appropriate generator for this version
    const adapter = getGenerator(version, effectiveFallbackMode);
    // Check if adapter explicitly supports this version
    const isExplicitlySupported = adapter.supports(version);
    return {
      version,
      adapter,
      majorVersion,
      minorVersion,
      dialect,
      isExplicitlySupported,
      // Only include appliedFallback if a fallback was used
      ...isExplicitlySupported ? {} : {
        appliedFallback: effectiveFallbackMode
      }
    };
  } catch (error) {
    // Enhance error with diagnostic information
    if (error instanceof Error) {
      error.message = `Failed to detect adapter for OpenAPI ${version}: ${error.message}\n` + `File: ${specPath}\n` + `Fallback mode: ${effectiveFallbackMode}`;
    }
    throw error;
  }
}
/**
 * CLI entry point for direct usage
 */ if (import.meta.main) {
  try {
    // Ensure a spec file path was provided
    if (Deno.args.length < 1) {
      console.error("Usage: deno run -A detect_adapter.ts <path-to-spec-file>");
      Deno.exit(1);
    }
    const specPath = Deno.args[0];
    // Check if file exists
    try {
      const stat = await Deno.stat(specPath);
      if (!stat.isFile) {
        console.error(`Error: ${specPath} is not a file`);
        Deno.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${specPath} does not exist or is not accessible`);
      Deno.exit(1);
    }
    // Get fallback mode from command line args if provided
    let fallbackMode;
    const fallbackArg = Deno.args.find((arg)=>arg.startsWith("--fallback="));
    if (fallbackArg) {
      const mode = fallbackArg.split("=")[1]?.toLowerCase();
      if (mode === "strict") fallbackMode = FallbackMode.STRICT;
      else if (mode === "warn") fallbackMode = FallbackMode.WARN;
      else if (mode === "auto") fallbackMode = FallbackMode.AUTO;
    }
    // Detect adapter and print result
    const result = await detectAdapter(specPath, fallbackMode);
    console.log(JSON.stringify({
      specPath,
      version: result.version,
      dialect: result.dialect,
      majorVersion: result.majorVersion,
      minorVersion: result.minorVersion,
      adapterName: result.adapter.name,
      explicitSupport: result.isExplicitlySupported,
      fallbackApplied: result.appliedFallback || null,
      fallbackMode: fallbackMode || getFallbackModeFromEnv()
    }, null, 2));
    Deno.exit(0);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL2RldGVjdF9hZGFwdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IC1TIGRlbm8gcnVuIC1BXG5cbi8qKlxuICogT3BlbkFQSSBBZGFwdGVyIERldGVjdGlvbiBTY3JpcHRcbiAqIFxuICogVGhpcyBzdGFuZGFsb25lIHNjcmlwdCBwcm92aWRlcyBhdXRvbWF0aWMgZGV0ZWN0aW9uIG9mIE9wZW5BUEkgdmVyc2lvbnNcbiAqIGFuZCBzZWxlY3RzIHRoZSBhcHByb3ByaWF0ZSBnZW5lcmF0b3IgYWRhcHRlci4gSXQgY2FuIGJlIHVzZWQgYnk6XG4gKiAtIEJ1aWxkIHByb2Nlc3NcbiAqIC0gQ0kgd29ya2Zsb3dzXG4gKiAtIFByZS1jb21taXQgaG9va3NcbiAqIC0gVXBncmFkZSBzY3JpcHRzXG4gKiBcbiAqIFVzYWdlOlxuICogICBpbXBvcnQgeyBkZXRlY3RBZGFwdGVyIH0gZnJvbSBcIi4vc2NyaXB0cy9jb2RlZ2VuL2RldGVjdF9hZGFwdGVyLnRzXCI7XG4gKiAgIGNvbnN0IHsgdmVyc2lvbiwgYWRhcHRlciB9ID0gYXdhaXQgZGV0ZWN0QWRhcHRlcihcInBhdGgvdG8vc3BlYy5qc29uXCIpO1xuICovXG5cbmltcG9ydCB7XG4gIEZhbGxiYWNrTW9kZSxcbiAgT3BlbkFwaUdlbmVyYXRvcixcbiAgZ2V0RmFsbGJhY2tNb2RlRnJvbUVudixcbiAgZ2V0R2VuZXJhdG9yXG59IGZyb20gXCIuL2FkYXB0ZXIudHNcIjtcblxuLyoqXG4gKiBSZXN1bHQgb2YgdGhlIGFkYXB0ZXIgZGV0ZWN0aW9uIHByb2Nlc3NcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZGFwdGVyRGV0ZWN0aW9uUmVzdWx0IHtcbiAgLyoqIFRoZSBkZXRlY3RlZCBPcGVuQVBJIHNwZWNpZmljYXRpb24gdmVyc2lvbiAoZS5nLiwgXCIzLjBcIiwgXCIzLjFcIiwgXCI0LjBcIikgKi9cbiAgdmVyc2lvbjogc3RyaW5nO1xuICAvKiogVGhlIGFwcHJvcHJpYXRlIGdlbmVyYXRvciBhZGFwdGVyIGZvciB0aGlzIHZlcnNpb24gKi9cbiAgYWRhcHRlcjogT3BlbkFwaUdlbmVyYXRvcjtcbiAgLyoqIE1ham9yIHZlcnNpb24gbnVtYmVyICovXG4gIG1ham9yVmVyc2lvbjogbnVtYmVyO1xuICAvKiogTWlub3IgdmVyc2lvbiBudW1iZXIgKi9cbiAgbWlub3JWZXJzaW9uOiBudW1iZXI7XG4gIC8qKiBGdWxsIGRpYWxlY3QgaWRlbnRpZmllciAoaWYgYXZhaWxhYmxlKSAqL1xuICBkaWFsZWN0Pzogc3RyaW5nO1xuICAvKiogV2hldGhlciB0aGUgYWRhcHRlciBleHBsaWNpdGx5IHN1cHBvcnRzIHRoaXMgdmVyc2lvbiAqL1xuICBpc0V4cGxpY2l0bHlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gIC8qKiBUaGUgZmFsbGJhY2sgbW9kZSB0aGF0IHdhcyBhcHBsaWVkLCBpZiBhbnkgKi9cbiAgYXBwbGllZEZhbGxiYWNrPzogRmFsbGJhY2tNb2RlO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSBPcGVuQVBJIHZlcnNpb24gZnJvbSBhIHNwZWNpZmljYXRpb24gZmlsZVxuICogXG4gKiBAcGFyYW0gc3BlY1BhdGggUGF0aCB0byB0aGUgT3BlbkFQSSBzcGVjaWZpY2F0aW9uIGZpbGVcbiAqIEByZXR1cm5zIFRoZSBkZXRlY3RlZCB2ZXJzaW9uIGFuZCBkaWFsZWN0IGluZm9ybWF0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0T3BlbkFwaVZlcnNpb24oc3BlY1BhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIG1ham9yVmVyc2lvbjogbnVtYmVyO1xuICBtaW5vclZlcnNpb246IG51bWJlcjtcbiAgZGlhbGVjdD86IHN0cmluZztcbn0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoc3BlY1BhdGgpO1xuICAgIGNvbnN0IHNwZWMgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgIFxuICAgIC8vIEdldCBkaWFsZWN0IGZyb20gY3VzdG9tIGV4dGVuc2lvbiBvciBmcm9tIG9wZW5hcGkvc3dhZ2dlciBmaWVsZFxuICAgIGxldCBkaWFsZWN0ID0gc3BlY1tcIngtb3BlbmFwaS1kaWFsZWN0XCJdIHx8IFwiXCI7XG4gICAgbGV0IHZlcnNpb24gPSBcIlwiO1xuICAgIFxuICAgIGlmICghZGlhbGVjdCkge1xuICAgICAgLy8gVHJ5IHRvIGV4dHJhY3QgZnJvbSBzdGFuZGFyZCBmaWVsZHNcbiAgICAgIGlmIChzcGVjLm9wZW5hcGkpIHtcbiAgICAgICAgdmVyc2lvbiA9IHNwZWMub3BlbmFwaTtcbiAgICAgICAgZGlhbGVjdCA9IGBodHRwczovL3NwZWMub3BlbmFwaXMub3JnL2RpYWxlY3QvJHt2ZXJzaW9ufWA7XG4gICAgICB9IGVsc2UgaWYgKHNwZWMuc3dhZ2dlcikge1xuICAgICAgICB2ZXJzaW9uID0gc3BlYy5zd2FnZ2VyO1xuICAgICAgICBkaWFsZWN0ID0gYGh0dHBzOi8vc3BlYy5vcGVuYXBpcy5vcmcvZGlhbGVjdC8ke3ZlcnNpb259YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlcnNpb24gPSBcInVua25vd25cIjtcbiAgICAgICAgZGlhbGVjdCA9IFwidW5rbm93blwiO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFeHRyYWN0IHZlcnNpb24gZnJvbSBkaWFsZWN0IFVSTCBpZiBwb3NzaWJsZVxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGlhbGVjdC5tYXRjaCgvXFwvKFswLTldK1xcLlswLTldKykvKTtcbiAgICAgIHZlcnNpb24gPSB2ZXJzaW9uTWF0Y2ggPyB2ZXJzaW9uTWF0Y2hbMV0gOiBcInVua25vd25cIjtcbiAgICB9XG4gICAgXG4gICAgLy8gUGFyc2UgdmVyc2lvbiBjb21wb25lbnRzXG4gICAgY29uc3QgdmVyc2lvblBhcnRzID0gdmVyc2lvbi5zcGxpdChcIi5cIik7XG4gICAgY29uc3QgbWFqb3JWZXJzaW9uID0gcGFyc2VJbnQodmVyc2lvblBhcnRzWzBdKSB8fCAwO1xuICAgIGNvbnN0IG1pbm9yVmVyc2lvbiA9IHBhcnNlSW50KHZlcnNpb25QYXJ0c1sxXSkgfHwgMDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdmVyc2lvbixcbiAgICAgIGRpYWxlY3QsXG4gICAgICBtYWpvclZlcnNpb24sXG4gICAgICBtaW5vclZlcnNpb25cbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGV4dHJhY3RpbmcgT3BlbkFQSSB2ZXJzaW9uIGZyb20gJHtzcGVjUGF0aH06YCwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyB0aGUgYXBwcm9wcmlhdGUgYWRhcHRlciBmb3IgYW4gT3BlbkFQSSBzcGVjaWZpY2F0aW9uIGZpbGVcbiAqXG4gKiBAcGFyYW0gc3BlY1BhdGggUGF0aCB0byB0aGUgT3BlbkFQSSBzcGVjaWZpY2F0aW9uIGZpbGVcbiAqIEBwYXJhbSBmYWxsYmFja01vZGUgT3B0aW9uYWwgZmFsbGJhY2sgbW9kZSwgZGVmYXVsdHMgdG8gZW52aXJvbm1lbnQgdmFyaWFibGUgc2V0dGluZ1xuICogQHJldHVybnMgRGV0ZWN0aW9uIHJlc3VsdCB3aXRoIHZlcnNpb24gaW5mbyBhbmQgYXBwcm9wcmlhdGUgYWRhcHRlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGV0ZWN0QWRhcHRlcihcbiAgc3BlY1BhdGg6IHN0cmluZyxcbiAgZmFsbGJhY2tNb2RlPzogRmFsbGJhY2tNb2RlXG4pOiBQcm9taXNlPEFkYXB0ZXJEZXRlY3Rpb25SZXN1bHQ+IHtcbiAgLy8gRXh0cmFjdCB0aGUgT3BlbkFQSSB2ZXJzaW9uIGZyb20gdGhlIHNwZWMgZmlsZVxuICBjb25zdCB7IHZlcnNpb24sIG1ham9yVmVyc2lvbiwgbWlub3JWZXJzaW9uLCBkaWFsZWN0IH0gPSBhd2FpdCBleHRyYWN0T3BlbkFwaVZlcnNpb24oc3BlY1BhdGgpO1xuICBcbiAgLy8gVXNlIHByb3ZpZGVkIGZhbGxiYWNrIG1vZGUgb3IgZ2V0IGZyb20gZW52aXJvbm1lbnRcbiAgY29uc3QgZWZmZWN0aXZlRmFsbGJhY2tNb2RlID0gZmFsbGJhY2tNb2RlIHx8IGdldEZhbGxiYWNrTW9kZUZyb21FbnYoKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gR2V0IHRoZSBhcHByb3ByaWF0ZSBnZW5lcmF0b3IgZm9yIHRoaXMgdmVyc2lvblxuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRHZW5lcmF0b3IodmVyc2lvbiwgZWZmZWN0aXZlRmFsbGJhY2tNb2RlKTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiBhZGFwdGVyIGV4cGxpY2l0bHkgc3VwcG9ydHMgdGhpcyB2ZXJzaW9uXG4gICAgY29uc3QgaXNFeHBsaWNpdGx5U3VwcG9ydGVkID0gYWRhcHRlci5zdXBwb3J0cyh2ZXJzaW9uKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdmVyc2lvbixcbiAgICAgIGFkYXB0ZXIsXG4gICAgICBtYWpvclZlcnNpb24sXG4gICAgICBtaW5vclZlcnNpb24sXG4gICAgICBkaWFsZWN0LFxuICAgICAgaXNFeHBsaWNpdGx5U3VwcG9ydGVkLFxuICAgICAgLy8gT25seSBpbmNsdWRlIGFwcGxpZWRGYWxsYmFjayBpZiBhIGZhbGxiYWNrIHdhcyB1c2VkXG4gICAgICAuLi4oaXNFeHBsaWNpdGx5U3VwcG9ydGVkID8ge30gOiB7IGFwcGxpZWRGYWxsYmFjazogZWZmZWN0aXZlRmFsbGJhY2tNb2RlIH0pXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBFbmhhbmNlIGVycm9yIHdpdGggZGlhZ25vc3RpYyBpbmZvcm1hdGlvblxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBlcnJvci5tZXNzYWdlID0gYEZhaWxlZCB0byBkZXRlY3QgYWRhcHRlciBmb3IgT3BlbkFQSSAke3ZlcnNpb259OiAke2Vycm9yLm1lc3NhZ2V9XFxuYCArXG4gICAgICAgIGBGaWxlOiAke3NwZWNQYXRofVxcbmAgK1xuICAgICAgICBgRmFsbGJhY2sgbW9kZTogJHtlZmZlY3RpdmVGYWxsYmFja01vZGV9YDtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiBDTEkgZW50cnkgcG9pbnQgZm9yIGRpcmVjdCB1c2FnZVxuICovXG5pZiAoaW1wb3J0Lm1ldGEubWFpbikge1xuICB0cnkge1xuICAgIC8vIEVuc3VyZSBhIHNwZWMgZmlsZSBwYXRoIHdhcyBwcm92aWRlZFxuICAgIGlmIChEZW5vLmFyZ3MubGVuZ3RoIDwgMSkge1xuICAgICAgY29uc29sZS5lcnJvcihcIlVzYWdlOiBkZW5vIHJ1biAtQSBkZXRlY3RfYWRhcHRlci50cyA8cGF0aC10by1zcGVjLWZpbGU+XCIpO1xuICAgICAgRGVuby5leGl0KDEpO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBzcGVjUGF0aCA9IERlbm8uYXJnc1swXTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiBmaWxlIGV4aXN0c1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0ID0gYXdhaXQgRGVuby5zdGF0KHNwZWNQYXRoKTtcbiAgICAgIGlmICghc3RhdC5pc0ZpbGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3I6ICR7c3BlY1BhdGh9IGlzIG5vdCBhIGZpbGVgKTtcbiAgICAgICAgRGVuby5leGl0KDEpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvcjogJHtzcGVjUGF0aH0gZG9lcyBub3QgZXhpc3Qgb3IgaXMgbm90IGFjY2Vzc2libGVgKTtcbiAgICAgIERlbm8uZXhpdCgxKTtcbiAgICB9XG4gICAgLy8gR2V0IGZhbGxiYWNrIG1vZGUgZnJvbSBjb21tYW5kIGxpbmUgYXJncyBpZiBwcm92aWRlZFxuICAgIGxldCBmYWxsYmFja01vZGU6IEZhbGxiYWNrTW9kZSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBmYWxsYmFja0FyZyA9IERlbm8uYXJncy5maW5kKGFyZyA9PiBhcmcuc3RhcnRzV2l0aChcIi0tZmFsbGJhY2s9XCIpKTtcbiAgICBpZiAoZmFsbGJhY2tBcmcpIHtcbiAgICAgIGNvbnN0IG1vZGUgPSBmYWxsYmFja0FyZy5zcGxpdChcIj1cIilbMV0/LnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAobW9kZSA9PT0gXCJzdHJpY3RcIikgZmFsbGJhY2tNb2RlID0gRmFsbGJhY2tNb2RlLlNUUklDVDtcbiAgICAgIGVsc2UgaWYgKG1vZGUgPT09IFwid2FyblwiKSBmYWxsYmFja01vZGUgPSBGYWxsYmFja01vZGUuV0FSTjtcbiAgICAgIGVsc2UgaWYgKG1vZGUgPT09IFwiYXV0b1wiKSBmYWxsYmFja01vZGUgPSBGYWxsYmFja01vZGUuQVVUTztcbiAgICB9XG4gICAgXG4gICAgLy8gRGV0ZWN0IGFkYXB0ZXIgYW5kIHByaW50IHJlc3VsdFxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRldGVjdEFkYXB0ZXIoc3BlY1BhdGgsIGZhbGxiYWNrTW9kZSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgc3BlY1BhdGgsXG4gICAgICB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbixcbiAgICAgIGRpYWxlY3Q6IHJlc3VsdC5kaWFsZWN0LFxuICAgICAgbWFqb3JWZXJzaW9uOiByZXN1bHQubWFqb3JWZXJzaW9uLFxuICAgICAgbWlub3JWZXJzaW9uOiByZXN1bHQubWlub3JWZXJzaW9uLFxuICAgICAgYWRhcHRlck5hbWU6IHJlc3VsdC5hZGFwdGVyLm5hbWUsXG4gICAgICBleHBsaWNpdFN1cHBvcnQ6IHJlc3VsdC5pc0V4cGxpY2l0bHlTdXBwb3J0ZWQsXG4gICAgICBmYWxsYmFja0FwcGxpZWQ6IHJlc3VsdC5hcHBsaWVkRmFsbGJhY2sgfHwgbnVsbCxcbiAgICAgIGZhbGxiYWNrTW9kZTogZmFsbGJhY2tNb2RlIHx8IGdldEZhbGxiYWNrTW9kZUZyb21FbnYoKVxuICAgIH0sIG51bGwsIDIpKTtcbiAgICBcbiAgICBcbiAgICBEZW5vLmV4aXQoMCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yOlwiLCBlcnJvcik7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3Iuc3RhY2spO1xuICAgIH1cbiAgICBEZW5vLmV4aXQoMSk7XG4gIH1cbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FFRCxTQUNFLFlBQVksRUFFWixzQkFBc0IsRUFDdEIsWUFBWSxRQUNQLGVBQWU7QUFzQnRCOzs7OztDQUtDLEdBQ0QsT0FBTyxlQUFlLHNCQUFzQixRQUFnQjtFQU0xRCxJQUFJO0lBQ0YsTUFBTSxVQUFVLE1BQU0sS0FBSyxZQUFZLENBQUM7SUFDeEMsTUFBTSxPQUFPLEtBQUssS0FBSyxDQUFDO0lBRXhCLGtFQUFrRTtJQUNsRSxJQUFJLFVBQVUsSUFBSSxDQUFDLG9CQUFvQixJQUFJO0lBQzNDLElBQUksVUFBVTtJQUVkLElBQUksQ0FBQyxTQUFTO01BQ1osc0NBQXNDO01BQ3RDLElBQUksS0FBSyxPQUFPLEVBQUU7UUFDaEIsVUFBVSxLQUFLLE9BQU87UUFDdEIsVUFBVSxDQUFDLGtDQUFrQyxFQUFFLFNBQVM7TUFDMUQsT0FBTyxJQUFJLEtBQUssT0FBTyxFQUFFO1FBQ3ZCLFVBQVUsS0FBSyxPQUFPO1FBQ3RCLFVBQVUsQ0FBQyxrQ0FBa0MsRUFBRSxTQUFTO01BQzFELE9BQU87UUFDTCxVQUFVO1FBQ1YsVUFBVTtNQUNaO0lBQ0YsT0FBTztNQUNMLCtDQUErQztNQUMvQyxNQUFNLGVBQWUsUUFBUSxLQUFLLENBQUM7TUFDbkMsVUFBVSxlQUFlLFlBQVksQ0FBQyxFQUFFLEdBQUc7SUFDN0M7SUFFQSwyQkFBMkI7SUFDM0Is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
// denoCacheMetadata=2923037708910008804,14201199715981690172