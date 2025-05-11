#!/usr/bin/env -S deno run -A
/**
 * Bundle script for WorkOS SDK
 *
 * This script bundles the WorkOS SDK for Node.js compatibility.
 * It creates both standard and edge/worker versions of the bundle.
 */

import { join } from '@std/path';
import { ensureDir } from '@std/fs';

// Configuration
const DIST_DIR = './dist';
const BUNDLE_STANDARD = 'workos.js';
const BUNDLE_WORKER = 'workos.worker.js';

// Use a dedicated import map for npm bundling
const IMPORT_MAP = './npm/import_map.npm.json';

// Entry points
const ENTRY_STANDARD = './src/index.ts';
const ENTRY_WORKER = './src/index.worker.ts';

async function main() {
  console.log('🚀 Starting WorkOS SDK bundling process for Node.js compatibility');
  console.log(`📋 Using import map: ${IMPORT_MAP}`);

  // Ensure the dist directory exists
  await ensureDir(DIST_DIR);

  try {
    // Bundle standard version
    console.log(`📦 Bundling standard SDK from ${ENTRY_STANDARD}`);
    const standardCommand = new Deno.Command('deno', {
      args: [
        'bundle',
        '--no-check',
        '--import-map',
        IMPORT_MAP,
        ENTRY_STANDARD,
        join(DIST_DIR, BUNDLE_STANDARD),
      ],
    });
    const standardOutput = await standardCommand.output();
    if (!standardOutput.success) {
      console.error('❌ Failed to bundle standard SDK');
      Deno.exit(1);
    }

    // Bundle worker version for edge environments
    console.log(`📦 Bundling worker SDK from ${ENTRY_WORKER}`);
    const workerCommand = new Deno.Command('deno', {
      args: [
        'bundle',
        '--no-check',
        '--import-map',
        IMPORT_MAP,
        ENTRY_WORKER,
        join(DIST_DIR, BUNDLE_WORKER),
      ],
    });
    const workerOutput = await workerCommand.output();
    if (!workerOutput.success) {
      console.error('❌ Failed to bundle worker SDK');
      Deno.exit(1);
    }

    console.log('✅ Bundling completed successfully');
    console.log(`📄 Standard bundle: ${join(DIST_DIR, BUNDLE_STANDARD)}`);
    console.log(`📄 Worker bundle: ${join(DIST_DIR, BUNDLE_WORKER)}`);

    // Create package.json for npm consumption
    await createPackageJson();

    console.log('🎉 All done!');
  } catch (error) {
    console.error('❌ Error during bundling:', error);
    Deno.exit(1);
  }
}

async function createPackageJson() {
  try {
    // Read the template package.json
    const packageTemplate = JSON.parse(await Deno.readTextFile('./npm/package.template.json'));
    
    // Read the version from deno.json
    const denoConfig = JSON.parse(await Deno.readTextFile('./deno.json'));
    
    // Update the version to match deno.json
    packageTemplate.version = denoConfig.version;
    
    // Write the package.json to the dist directory
    await Deno.writeTextFile(
      join(DIST_DIR, 'package.json'),
      JSON.stringify(packageTemplate, null, 2),
    );
    console.log(`📄 Created package.json in ${DIST_DIR}`);
  } catch (error) {
    console.error('❌ Error creating package.json:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
