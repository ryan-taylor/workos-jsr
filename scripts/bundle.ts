#!/usr/bin/env -S deno run -A
/**
 * Bundle script for WorkOS SDK
 *
 * This script bundles the WorkOS SDK for deployment to Deno Deploy.
 * It creates both standard and edge/worker versions of the bundle.
 */

import { join } from '@std/path';
import { ensureDir } from '@std/fs';

// Configuration
const DIST_DIR = './dist';
const BUNDLE_STANDARD = 'workos.js';
const BUNDLE_WORKER = 'workos.worker.js';

// Entry points
const ENTRY_STANDARD = './src/index.ts';
const ENTRY_WORKER = './src/index.worker.ts';

async function main() {
  console.log('🚀 Starting WorkOS SDK bundling process');

  // Ensure the dist directory exists
  await ensureDir(DIST_DIR);

  try {
    // Bundle standard version
    console.log(`📦 Bundling standard SDK from ${ENTRY_STANDARD}`);
    const standardCommand = new Deno.Command('deno', {
      args: [
        'bundle',
        '--no-check',
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
  // Read the current package.json to get version
  const packageJson = JSON.parse(await Deno.readTextFile('./package.json'));

  // Create a simplified package.json for the bundled version
  const deployPackage = {
    name: packageJson.name,
    version: packageJson.version,
    description: 'WorkOS SDK for JavaScript, optimized for Deno Deploy and Edge environments',
    main: './workos.js',
    browser: './workos.worker.js',
    'deno.land/x': {
      'standard': './workos.js',
      'worker': './workos.worker.js',
    },
    exports: {
      '.': {
        'import': './workos.js',
        'require': './workos.js',
        'browser': './workos.worker.js',
        'worker': './workos.worker.js',
        'edge-light': './workos.worker.js',
        'deno': './workos.js',
      },
    },
    license: packageJson.license || 'MIT',
  };

  await Deno.writeTextFile(
    join(DIST_DIR, 'package.json'),
    JSON.stringify(deployPackage, null, 2),
  );
  console.log(`📄 Created package.json in ${DIST_DIR}`);
}

if (import.meta.main) {
  await main();
}
