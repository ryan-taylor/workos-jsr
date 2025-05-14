#!/usr/bin/env -S deno run -A

/**
 * Install oasdiff Binary
 *
 * This script downloads and installs the oasdiff binary from GitHub releases.
 * It supports multiple platforms (Windows, macOS, Linux) and handles verification
 * of the downloaded binary.
 *
 * Usage:
 *   deno run -A scripts/ci/install-oasdiff.ts [options]
 *
 * Options:
 *   --version=<ver>  Specify the oasdiff version to download (default: latest)
 *   --force          Force download even if binary already exists
 *   --help           Show help information
 *
 * The script will:
 * 1. Determine the OS and architecture
 * 2. Download the appropriate binary from GitHub releases
 * 3. Verify the binary integrity
 * 4. Make the binary executable
 */

import { parse } from "https://deno.land/std/flags/mod.ts"; // Keep this import since flags might not be available in JSR
import { dirname, join } from "jsr:@std/path@^1";
import { ensureDir, exists } from "jsr:@std/fs@^1";

// Configuration
const GITHUB_REPO = "Tufin/oasdiff";
const DEFAULT_VERSION = "latest"; // Will resolve to latest release
const BINARY_NAME = Deno.build.os === "windows" ? "oasdiff.exe" : "oasdiff";
const BINARY_DIR = join(Deno.cwd(), ".tools", "bin");
const BINARY_PATH = join(BINARY_DIR, BINARY_NAME);

/**
 * Parse command line arguments
 */
function parseArgs() {
  const flags = parse(Deno.args, {
    boolean: ["force", "help"],
    string: ["version"],
    alias: {
      h: "help",
      f: "force",
      v: "version",
    },
    default: {
      force: false,
      help: false,
      version: DEFAULT_VERSION,
    },
  });

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  return {
    version: flags.version,
    force: flags.force,
  };
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Install oasdiff Binary

This script downloads and installs the oasdiff binary from GitHub releases.
It supports multiple platforms (Windows, macOS, Linux) and handles verification
of the downloaded binary.

Usage:
  deno run -A scripts/ci/install-oasdiff.ts [options]

Options:
  --version=<ver>  Specify the oasdiff version to download (default: latest)
  --force          Force download even if binary already exists
  --help           Show help information
`);
}

/**
 * Determine the appropriate asset name based on OS and architecture
 */
function getAssetName(version: string): string {
  const os = Deno.build.os;
  const arch = Deno.build.arch;

  let osName: string;
  let archName: string;

  // Map OS
  switch (os) {
    case "windows":
      osName = "windows";
      break;
    case "darwin":
      osName = "darwin";
      break;
    case "linux":
      osName = "linux";
      break;
    default:
      throw new Error(`Unsupported OS: ${os}`);
  }

  // Map architecture
  switch (arch) {
    case "x86_64":
      archName = "amd64";
      break;
    case "aarch64":
      archName = "arm64";
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  // The version will be resolved later if it's "latest"
  return `oasdiff_${version.replace(/^v/, "")}_${osName}_${archName}${
    os === "windows" ? ".exe" : ""
  }`;
}

/**
 * Get latest release version
 */
async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tag_name;
  } catch (error) {
    throw new Error(
      `Error fetching latest version: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Download the binary
 */
async function downloadBinary(version: string): Promise<void> {
  try {
    // Resolve latest version if needed
    let resolvedVersion = version;
    if (version === "latest") {
      console.log("Fetching latest release version...");
      resolvedVersion = await getLatestVersion();
      console.log(`Latest version: ${resolvedVersion}`);
    }

    // Get asset name based on OS and architecture
    const assetName = getAssetName(resolvedVersion);

    // Construct download URL
    const downloadUrl =
      `https://github.com/${GITHUB_REPO}/releases/download/${resolvedVersion}/${assetName}`;
    console.log(`Downloading from: ${downloadUrl}`);

    // Create directory if it doesn't exist
    await ensureDir(BINARY_DIR);

    // Download the binary
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download binary: ${response.statusText}`);
    }

    const fileData = new Uint8Array(await response.arrayBuffer());
    Deno.writeFileSync(BINARY_PATH, fileData);

    // Make executable on Unix platforms
    if (Deno.build.os !== "windows") {
      await Deno.chmod(BINARY_PATH, 0o755);
    }

    console.log(`Successfully downloaded oasdiff to ${BINARY_PATH}`);
  } catch (error) {
    throw new Error(
      `Error downloading binary: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Verify the binary integrity by running a simple command
 */
async function verifyBinary(): Promise<boolean> {
  try {
    const command = Deno.build.os === "windows"
      ? new Deno.Command(BINARY_PATH, { args: ["--version"] })
      : new Deno.Command(BINARY_PATH, { args: ["--version"] });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      console.error("Binary verification failed: non-zero exit code");
      return false;
    }

    const output = new TextDecoder().decode(stdout);
    if (!output.includes("oasdiff")) {
      console.error("Binary verification failed: unexpected output");
      return false;
    }

    console.log("Binary verification passed");
    return true;
  } catch (error) {
    console.error(
      `Binary verification failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const { version, force } = parseArgs();

    // Check if binary already exists and is not forced to redownload
    if (!force && await exists(BINARY_PATH)) {
      console.log(`oasdiff binary already exists at ${BINARY_PATH}`);

      // Verify existing binary
      if (await verifyBinary()) {
        console.log("Existing binary is valid");
        return;
      } else {
        console.log("Existing binary is invalid, redownloading...");
      }
    }

    // Download and install binary
    await downloadBinary(version);

    // Verify the downloaded binary
    if (await verifyBinary()) {
      console.log("Installation successful");
    } else {
      console.error(
        "Installation failed: downloaded binary verification failed",
      );
      Deno.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}

// Export the binary path for use in other modules
export const OASDIFF_BINARY_PATH = BINARY_PATH;
