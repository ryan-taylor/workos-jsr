# npm Compatibility Distribution for WorkOS SDK

This directory contains the build scripts and configuration files for creating a
Node.js-compatible distribution of the WorkOS SDK. This is a secondary distribution
option, with Deno being our primary and recommended platform.

## Purpose

The WorkOS SDK is designed as a Deno-native package, optimized for Deno 2.x environments.
We maintain this npm distribution solely for compatibility purposes:

1. To support users who are in the process of migrating from Node.js to Deno
2. To provide limited compatibility for projects that must use Node.js
3. To serve as a transition path for organizations moving toward Deno

**Note:** For the best experience, most complete feature set, and optimal performance,
we strongly recommend using the Deno version of this SDK with JSR.io.

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

## Limitations and Considerations

The npm distribution has significant limitations compared to the Deno version:

1. **Limited Feature Set**: Some Deno-specific features may be unavailable or have reduced functionality
2. **Performance Tradeoffs**: It's optimized for compatibility rather than Node.js-specific performance
3. **Secondary Support**: Features and bug fixes are implemented in the Deno version first
4. **Compromised Type Safety**: Some of the advanced TypeScript features we use in Deno may be downgraded
5. **Delayed Updates**: The npm distribution may lag behind the Deno version for new features

## Recommended Transition Path

If you're currently using the npm distribution, we recommend planning a transition to Deno:

1. Begin by identifying core dependencies that can be migrated to Deno
2. Gradually transition components to use Deno and Fresh
3. Consider a hybrid approach during transition if needed
4. Eventually move to a full Deno implementation

For additional guidance on transitioning from Node.js to Deno, refer to our [MIGRATION.md](../MIGRATION.md) document.

## Using the npm Distribution

If you must use the npm distribution, install it via:

```bash
npm install @ryantaylor/workos
```

Initialize the SDK as you would in Node.js:

```javascript
const { WorkOS } = require('@ryantaylor/workos');

const workos = new WorkOS(
  process.env.WORKOS_API_KEY,
  { clientId: process.env.WORKOS_CLIENT_ID }
);
```
