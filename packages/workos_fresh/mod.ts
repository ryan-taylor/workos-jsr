// packages/workos_fresh/mod.ts
// Re-export all Fresh-specific helpers

// Re-export the core SDK for convenience
export * from "../workos_sdk/mod.ts";

// Export Fresh compatibility layer
export * from "./src/types.ts";
export * from "./src/router.ts";
export * from "./src/server.ts";
export * from "./src/middleware.ts";
export type { FreshContext } from "./src/context.ts";
export { default as getTailwindPlugin } from "./src/plugins/tailwind.ts";
