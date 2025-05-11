/**
 * Fresh compatibility layer for router
 * This file provides a makeRouter function that works with both Fresh 1.x and 2.x
 */

import { freshMajor } from "../../scripts/select_fresh.ts";

export type Handler = (req: Request, ctx: any) => Response | Promise<Response>;
export type RoutePattern = string | RegExp | URLPattern;

export interface Route {
  pattern: RoutePattern;
  handler: Handler;
  middleware?: any[];
}

/**
 * Creates a router that works with both Fresh 1.x and 2.x
 * @param routes Array of route definitions
 * @returns A router handler function
 */
export async function makeRouter(routes: Route[]) {
  if (freshMajor() === 1) {
    const { createHandler } = await import("$fresh/server.ts");
    // For Fresh 1.x, we need to create a Manifest object with routes
    const manifest = {
      routes: Object.fromEntries(routes.map((route, i) => [`route${i}`, { handler: route.handler }])),
      islands: {},
      baseUrl: import.meta.url
    };
    return createHandler(manifest);
  } else {
    const { App } = await import("@fresh/core/server.ts");
    const app = new App();
    
    // Add routes to the app
    for (const route of routes) {
      app.all(route.pattern, route.handler);
    }
    
    return app.build();
  }
}