# Node.js Distribution for WorkOS SDK

This directory contains the build scripts and configuration files for creating a
Node.js-compatible distribution of the WorkOS SDK.

## Purpose

While the primary focus of this SDK is Deno 2.x environments, we maintain a
Node.js distribution to:

1. Support users who are in the process of migrating from Node.js to Deno
2. Provide compatibility for projects that use both Node.js and Deno
3. Ensure wider adoption across different JavaScript environments

## How It Works

The build process:

1. Uses Deno's bundling capabilities to create JavaScript bundles compatible
   with Node.js
2. Creates both standard and worker/edge versions of the SDK
3. Generates a package.json file with the appropriate configuration for npm
   publishing
4. Maintains version synchronization between the Deno and Node.js distributions

## Usage

To build the Node.js distribution:

```bash
deno task npm:build
```

This will create the distribution in the `dist/` directory, which can then be
published to npm.

## Limitations

The Node.js distribution has some limitations compared to the Deno version:

1. It may not include all Deno-specific features
2. It's optimized for compatibility rather than Node.js-specific performance
3. It's maintained primarily to support migration paths, not as a first-class
   Node.js SDK

For the best experience, we recommend using the Deno version of the SDK when
possible.
