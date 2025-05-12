/**
 * Fresh compatibility layer for router
 * This file provides a makeRouter function that works with both Fresh 1.x and 2.x
 */

import { freshMajor } from "../../../scripts/select_fresh.ts";
import { Fresh1, Fresh2, Route } from "./types.ts";

export type { Handler, Route, RoutePattern } from "./types.ts";

/**
 * Creates a router that works with both Fresh 1.x and 2.x
 * @param routes Array of route definitions
 * @returns A router handler function
 */
export async function makeRouter(
  routes: Route[],
): Promise<(req: Request) => Promise<Response>> {
  const version = freshMajor();

  // Create a Manifest object with routes (used for Fresh 1.x)
  const manifest: Fresh1.Manifest = {
    routes: Object.fromEntries(
      routes.map((route, i) => [`route${i}`, { handler: route.handler }]),
    ),
    islands: {},
    baseUrl: import.meta.url,
  };

  if (version === 1) {
    // For Fresh 1.x - use static imports that TypeScript understands
    try {
      const freshModule = await import(
        "$fresh/server.ts"
      ) as Fresh1.ServerModule;
      const handlerPromise = freshModule.createHandler(manifest);

      // Wait for the handler to be created
      const handler = await handlerPromise;

      // Return a function that matches our expected signature
      return (req: Request) => handler(req);
    } catch (error) {
      console.error("Error initializing Fresh 1.x router:", error);
      return (_req: Request) =>
        Promise.resolve(
          new Response("Router initialization failed", { status: 500 }),
        );
    }
  } else {
    // For Fresh 2.x - use dynamic imports with proper error handling
    try {
      // We need to use dynamic imports for Fresh 2.x since TypeScript only sees the default import map
      // This is a cleaner approach than using the Function constructor

      // Define a fallback handler in case the import fails
      let appHandler: (req: Request) => Promise<Response> = (_req: Request) => {
        return Promise.resolve(
          new Response("App not initialized", { status: 500 }),
        );
      };

      // At runtime, this will use the correct import map based on the DENO_FRESH_VERSION
      // TypeScript will show an error, but it will work at runtime
      try {
        // We need to use a string literal here to prevent TypeScript from checking the import
        // This is a limitation of the current setup, but it's better than using the Function constructor
        const modulePath = "@fresh/core";
        const freshModule = await import(new URL(modulePath, import.meta.url).href) as Fresh2.ServerModule;

        const App = freshModule.App;
        const app = new App();

        for (const route of routes) {
          app.all(route.pattern, route.handler);
        }

        appHandler = app.build();
      } catch (importError) {
        console.error("Error importing Fresh 2.x module:", importError);
      }

      return appHandler;
    } catch (error) {
      console.error("Error initializing Fresh 2.x router:", error);
      return (_req: Request) =>
        Promise.resolve(
          new Response("Router initialization failed", { status: 500 }),
        );
    }
  }
}
