# Fresh Migration Guide

This guide explains how to use the WorkOS SDK with both Fresh 1.x and Fresh 2.x,
and how to write code that works with both versions.

## Overview of the Compatibility Layer

The WorkOS SDK includes a compatibility layer that allows your code to work
seamlessly with both Fresh 1.x and Fresh 2.x. This layer:

1. Dynamically selects the appropriate import maps based on the
   `DENO_FRESH_VERSION` environment variable
2. Provides compatibility wrappers for key Fresh APIs that have changed between
   versions
3. Abstracts away version-specific differences in routing, middleware, and
   context handling

## How to Use the Compatibility Layer

### Setting the Fresh Version

Set the `DENO_FRESH_VERSION` environment variable to choose which Fresh version
to use:

```bash
# Use Fresh 1.x (default)
export DENO_FRESH_VERSION=1

# Use Fresh 2.x (canary)
export DENO_FRESH_VERSION=2
```

The SDK will automatically use the appropriate import maps and dependencies
based on this setting.

### Using the Compatibility Barrels

Instead of importing directly from Fresh, import from the compatibility barrels:

```typescript
// ❌ Don't import directly from Fresh
import { FreshContext } from "$fresh/server.ts";
// or
import { App } from "@fresh/core/server.ts";

// ✅ Do import from the compatibility layer
import { FreshContext } from "../src/fresh-compat/context.ts";
import { getFreshServerModule } from "../src/fresh-compat/server.ts";
```

The compatibility layer provides the following modules:

- `src/fresh-compat/server.ts` - Server-related functionality
- `src/fresh-compat/router.ts` - Routing functionality
- `src/fresh-compat/middleware.ts` - Middleware helpers
- `src/fresh-compat/context.ts` - Context type definitions
- `src/fresh-compat/plugins/tailwind.ts` - Tailwind plugin compatibility

### Writing Version-Agnostic Code

#### For Routing

Use the `makeRouter` function to create routes that work with both Fresh
versions:

```typescript
import { makeRouter } from "../src/fresh-compat/router.ts";

const routes = [
  {
    pattern: "/api/users",
    handler: (req, ctx) => {
      // Your handler code
      return new Response("Users API");
    },
  },
];

// Create a router that works with both Fresh 1.x and 2.x
const handler = await makeRouter(routes);
```

#### For Middleware

Use the `wrapMw` function to create middleware that works with both Fresh
versions:

```typescript
import { wrapMw } from "../src/fresh-compat/middleware.ts";

// Create middleware that works with both Fresh 1.x and 2.x
const authMiddleware = wrapMw(async (req, ctx) => {
  // Your middleware code
  return await ctx.next();
});
```

#### For Context

Use the common `FreshContext` interface:

```typescript
import { FreshContext } from "../src/fresh-compat/context.ts";

function handler(req: Request, ctx: FreshContext) {
  // Your handler code
  return new Response("Hello");
}
```

#### For Plugins

Use the plugin helpers for version-specific plugins:

```typescript
import getTailwindPlugin from "../src/fresh-compat/plugins/tailwind.ts";

// In your fresh.config.ts
const tailwind = await getTailwindPlugin();
export default {
  plugins: [
    tailwind(),
  ],
};
```

## Type System

The compatibility layer includes a comprehensive type system that provides
proper type definitions for both Fresh 1.x and 2.x. This type system is defined
in `src/fresh-compat/types.ts` and includes:

### Common Types

- `Handler`: A function that handles HTTP requests
- `RoutePattern`: A string, RegExp, or URLPattern that defines a route
- `Route`: An object that defines a route with a pattern and handler

### Fresh 1.x Types

The `Fresh1` namespace includes types specific to Fresh 1.x:

- `Manifest`: The manifest object used by Fresh 1.x
- `ServeHandlerInfo`: Connection information for the request
- `CreateHandler`: The function that creates a request handler
- `ServerModule`: The module exported by Fresh 1.x

### Fresh 2.x Types

The `Fresh2` namespace includes types specific to Fresh 2.x:

- `App`: The App class used by Fresh 2.x
- `AppConstructor`: The constructor for the App class
- `ServerModule`: The module exported by Fresh 2.x
- `TailwindPlugin`: The Tailwind plugin for Fresh 2.x

### Using the Type System

When writing code that works with both Fresh versions, import types from the
compatibility layer:

```typescript
import { Handler, Route, RoutePattern } from "../src/fresh-compat/types.ts";
import { Fresh1, Fresh2 } from "../src/fresh-compat/types.ts";

// Define a handler that works with both versions
const handler: Handler = (req, ctx) => {
  return new Response("Hello");
};

// Define a route that works with both versions
const route: Route = {
  pattern: "/api/users",
  handler,
};
```

The type system ensures that your code is type-safe and works with both Fresh
versions.

## Key Differences Between Fresh 1.x and 2.x APIs

### Server API Changes

| Fresh 1.x                                          | Fresh 2.x                                     | Compatibility Solution       |
| -------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| `import { createHandler } from "$fresh/server.ts"` | `import { App } from "@fresh/core/server.ts"` | Use `getFreshServerModule()` |
| `createHandler(manifest)`                          | `new App().build()`                           | Use `makeRouter()`           |

### Middleware API Changes

| Fresh 1.x                                  | Fresh 2.x                    | Compatibility Solution |
| ------------------------------------------ | ---------------------------- | ---------------------- |
| `(req: Request, ctx: Context) => Response` | `(ctx: Context) => Response` | Use `wrapMw()`         |
| `ctx.next()`                               | `ctx.next()` (unchanged)     | Use standard pattern   |

### Context API Changes

| Fresh 1.x                 | Fresh 2.x                             | Compatibility Solution              |
| ------------------------- | ------------------------------------- | ----------------------------------- |
| `req` property on context | No `req` property (use `ctx.request`) | Use common `FreshContext` interface |
| `state` as generic        | `state` as generic (unchanged)        | Use common pattern                  |

### Plugin API Changes

| Fresh 1.x                                           | Fresh 2.x                                                 | Compatibility Solution    |
| --------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| `import twindPlugin from "$fresh/plugins/twind.ts"` | `import twindPlugin from "@fresh/plugin-twindcss/mod.ts"` | Use `getTailwindPlugin()` |

## Examples of Using the Compatibility Layer

### Example: Creating a Simple API

```typescript
// routes/api/users.ts
import { FreshContext } from "../../src/fresh-compat/context.ts";

export function handler(req: Request, ctx: FreshContext) {
  return new Response(JSON.stringify({ users: ["Alice", "Bob"] }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

### Example: Using Middleware

```typescript
// routes/_middleware.ts
import { wrapMw } from "../src/fresh-compat/middleware.ts";
import { FreshContext } from "../src/fresh-compat/context.ts";

export const handler = wrapMw(async (req: Request, ctx: FreshContext) => {
  // Add user to context if authenticated
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (token) {
    ctx.state.user = { id: "123", name: "Alice" };
  }

  return await ctx.next();
});
```

### Example: Custom Router

```typescript
// server.ts
import { makeRouter } from "./src/fresh-compat/router.ts";

const routes = [
  {
    pattern: "/",
    handler: (req, ctx) => new Response("Home page"),
  },
  {
    pattern: "/api/data",
    handler: (req, ctx) => new Response(JSON.stringify({ data: "value" })),
  },
];

const handler = await makeRouter(routes);
Deno.serve(handler);
```

### Example: Using the Type System

```typescript
// custom-router.ts
import { Fresh1, Fresh2, Route } from "../src/fresh-compat/types.ts";
import { freshMajor } from "../scripts/select_fresh.ts";

// Define routes that work with both versions
const routes: Route[] = [
  {
    pattern: "/api/users",
    handler: (req, ctx) =>
      new Response(JSON.stringify({ users: ["Alice", "Bob"] })),
  },
  {
    pattern: "/api/products",
    handler: (req, ctx) =>
      new Response(JSON.stringify({ products: ["Product A", "Product B"] })),
  },
];

// Create a router based on the Fresh version
export async function createRouter() {
  if (freshMajor() === 1) {
    // For Fresh 1.x
    const manifest: Fresh1.Manifest = {
      routes: Object.fromEntries(
        routes.map((route, i) => [`route${i}`, { handler: route.handler }]),
      ),
      islands: {},
      baseUrl: import.meta.url,
    };

    const { createHandler } = await import(
      "$fresh/server.ts"
    ) as Fresh1.ServerModule;
    return await createHandler(manifest);
  } else {
    // For Fresh 2.x
    const { App } = await import("@fresh/core") as Fresh2.ServerModule;
    const app = new App();

    for (const route of routes) {
      app.all(route.pattern, route.handler);
    }

    return app.build();
  }
}
```

## Best Practices

1. **Always use the compatibility layer** when working with Fresh-specific APIs
2. **Test with both Fresh versions** using the test matrix
3. **Keep imports version-agnostic** by using the compatibility barrels
4. **Follow the patterns** demonstrated in the examples
5. **Use the type system** to ensure type safety and compatibility
6. **Avoid direct imports** from Fresh modules
7. **Handle errors properly** when working with dynamic imports
8. **Contribute improvements** to the compatibility layer when you find edge
   cases

## Testing with Both Fresh Versions

The SDK includes tasks for testing with both Fresh versions:

```bash
# Test with Fresh 1.x
deno task test:fresh1

# Test with Fresh 2.x
deno task test:fresh2

# Test with both versions (in CI)
deno task test:ci
```

The CI pipeline automatically tests against both Fresh versions using a test
matrix.
