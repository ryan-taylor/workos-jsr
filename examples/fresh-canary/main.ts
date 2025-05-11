/**
 * Example Fresh Canary app that imports from both workos_sdk and workos_fresh packages
 */

// Import from workos_sdk
import { WorkOS } from "../../packages/workos_sdk/mod.ts";

// Import from workos_fresh
import {
  makeRouter,
  getFreshServerModule,
  wrapMw,
  getTailwindPlugin,
  type FreshContext,
  type Route,
} from "../../packages/workos_fresh/mod.ts";

// Example usage of WorkOS SDK
const workos = new WorkOS({
  apiKey: Deno.env.get("WORKOS_API_KEY") || "sk_example_123456789",
  clientId: Deno.env.get("WORKOS_CLIENT_ID") || "client_123456789",
});

// Example middleware using Fresh compatibility layer
const authMiddleware = wrapMw(async (req: Request, ctx: FreshContext) => {
  console.log("Auth middleware running");
  // Example authentication check
  const url = new URL(req.url);
  if (url.pathname.startsWith("/admin") && !url.searchParams.has("token")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return await ctx.render();
});

// Example route definitions
const routes: Route[] = [
  {
    pattern: "/",
    handler: (_req: Request, ctx: FreshContext) => {
      return new Response("Hello from WorkOS Fresh example!");
    },
  },
  {
    pattern: "/admin",
    handler: (_req: Request, ctx: FreshContext) => {
      return new Response("Admin area");
    },
    middleware: [authMiddleware],
  },
];

// Example of creating a router
async function startServer() {
  try {
    // Get the Tailwind plugin
    const tailwind = await getTailwindPlugin();
    console.log("Tailwind plugin loaded");

    // Create a router
    const router = await makeRouter(routes);
    console.log("Router created");

    // Example of using the router
    const req = new Request("http://localhost:8000/");
    const res = await router(req);
    console.log("Response status:", res.status);

    console.log("Server ready!");
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

// This would be called in a real app
// startServer();

console.log("WorkOS Fresh example app loaded successfully");
