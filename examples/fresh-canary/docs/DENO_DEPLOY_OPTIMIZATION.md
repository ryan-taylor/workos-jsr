# Deno Deploy Optimization Guide for Fresh 2.x Canary

This guide provides best practices for optimizing Fresh 2.x Canary applications for deployment on Deno Deploy.

## What is Deno Deploy?

Deno Deploy is a distributed system that runs JavaScript, TypeScript, and WebAssembly at the edge, close to users. It's built on the V8 JavaScript engine and integrates seamlessly with Deno applications, making it an ideal platform for deploying Fresh applications.

## Configuration for Deno Deploy

### Fresh Configuration

The `fresh.config.ts` file should be optimized for Deno Deploy:

```typescript
import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  // Server configuration optimized for Deno Deploy
  server: {
    port: 8000,
    hostname: "0.0.0.0",
  },
  
  // Better URL handling in edge environments
  router: {
    trailingSlash: false,
  }
});
```

### Import Map

Your `deno.json` file should include an import map that uses URLs compatible with Deno Deploy:

```json
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.5/",
    "preact": "https://esm.sh/preact@10.19.3",
    "preact/": "https://esm.sh/preact@10.19.3/",
    "preact-render-to-string": "https://esm.sh/*preact-render-to-string@6.3.1",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.5.1",
    "$std/": "https://deno.land/std@0.220.0/"
  }
}
```

Always use versioned URLs to ensure consistency between development and production environments.

## Performance Optimizations

### Asset Optimization

1. **Minimize Asset Size**:
   - Use modern image formats like WebP or AVIF
   - Compress images appropriately
   - Minify CSS and JavaScript files

2. **Efficient Asset Loading**:
   - Use `<link rel="preload">` for critical assets
   - Implement lazy loading for images and non-critical resources
   - Consider using the `loading="lazy"` attribute for images

### Code Splitting

Fresh automatically handles code splitting for islands, but you can further optimize by:

1. **Keeping Islands Small**:
   - Create focused islands with specific functionality
   - Avoid large dependencies in islands

2. **Dynamic Imports**:
   - Use dynamic imports for code that isn't immediately needed
   ```typescript
   const heavyModule = await import("./heavy-module.ts");
   ```

### Caching Strategies

1. **Static Asset Caching**:
   - Set appropriate cache headers for static assets
   - Use versioned file names for cache busting when needed

2. **API Response Caching**:
   - Implement caching for API responses where appropriate
   - Use the Cache API for storing and retrieving cached data

```typescript
// Example of using the Cache API
async function fetchWithCache(request: Request) {
  const cache = await caches.open("api-cache");
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  
  return response;
}
```

## Environment Variables and Secrets

Deno Deploy supports environment variables for storing configuration and secrets:

1. **Accessing Environment Variables**:
   ```typescript
   const apiKey = Deno.env.get("API_KEY");
   ```

2. **Setting Environment Variables**:
   - Use the Deno Deploy dashboard to set environment variables
   - For local development, use a `.env` file (but don't commit it to version control)

## Handling Edge-Specific Features

### Geolocation

Deno Deploy provides geolocation information through request headers:

```typescript
export const handler: Handlers = {
  GET(req, ctx) {
    const country = req.headers.get("x-country") || "unknown";
    // Use country information to customize response
    return ctx.render({ country });
  }
};
```

### Regional Deployments

Deno Deploy automatically deploys your application to multiple regions worldwide. To optimize for this:

1. **Avoid Region-Specific Code**:
   - Don't hardcode assumptions about server location
   - Use relative times instead of specific time zones when possible

2. **Distributed Data Access**:
   - Use globally distributed databases when possible
   - Implement caching to reduce database access latency

## Error Handling and Logging

1. **Structured Error Handling**:
   ```typescript
   try {
     // Operation that might fail
   } catch (error) {
     // Log the error
     console.error("Operation failed:", error);
     
     // Return a graceful error response
     return new Response("Something went wrong", { status: 500 });
   }
   ```

2. **Logging Best Practices**:
   - Use `console.error` for errors
   - Use `console.warn` for warnings
   - Use `console.info` for informational messages
   - Use `console.debug` for debug messages

## Monitoring and Debugging

1. **Request Logging Middleware**:
   ```typescript
   async function loggerMiddleware(req: Request, ctx: MiddlewareHandlerContext) {
     const start = performance.now();
     const resp = await ctx.next();
     const end = performance.now();
     
     console.log(`${req.method} ${req.url} - ${resp.status} - ${(end - start).toFixed(2)}ms`);
     
     return resp;
   }
   ```

2. **Performance Monitoring**:
   - Use the Performance API to measure critical operations
   ```typescript
   const start = performance.now();
   // Perform operation
   const end = performance.now();
   console.log(`Operation took ${end - start}ms`);
   ```

## Deployment Process

1. **Continuous Deployment**:
   - Set up GitHub Actions to automatically deploy to Deno Deploy
   - Use the Deno Deploy GitHub integration

2. **Example GitHub Action**:
   ```yaml
   name: Deploy
   on: [push]
   
   jobs:
     deploy:
       name: Deploy
       runs-on: ubuntu-latest
       permissions:
         id-token: write
         contents: read
       
       steps:
         - name: Clone repository
           uses: actions/checkout@v3
         
         - name: Deploy to Deno Deploy
           uses: denoland/deployctl@v1
           with:
             project: your-project-name
             entrypoint: main.ts
   ```

## Testing for Deno Deploy Compatibility

Before deploying, ensure your application is compatible with Deno Deploy:

1. **Avoid Node.js-specific APIs**:
   - Don't use `require()`
   - Don't use Node.js built-in modules like `fs`, `path`, etc.
   - Use Deno-compatible alternatives from the standard library

2. **Use Deno-Compatible Dependencies**:
   - Prefer dependencies from `deno.land/x` or `esm.sh`
   - Avoid npm packages that use Node.js-specific features

3. **Test Locally with Restrictions**:
   - Run your application with the `--no-npm` flag to ensure you're not using npm packages
   - Use the `--allow-net` flag to restrict network access to only the domains you need

## Conclusion

By following these optimization strategies, your Fresh 2.x Canary application will be well-optimized for Deno Deploy, providing fast, reliable performance for users worldwide. Deno Deploy's edge runtime combined with Fresh's efficient rendering approach creates a powerful platform for building modern web applications.