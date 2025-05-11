/**
 * Fresh compatibility layer type definitions
 * This file provides type definitions for both Fresh 1.x and 2.x
 */

// Common types
export type Handler = (req: Request, ctx: any) => Response | Promise<Response>;
export type RoutePattern = string | RegExp | URLPattern;

export interface Route {
  pattern: RoutePattern;
  handler: Handler;
  middleware?: any[];
}

// Fresh 1.x types
export namespace Fresh1 {
  export interface Manifest {
    routes: Record<string, { handler: Handler }>;
    islands: Record<string, unknown>;
    baseUrl: string;
  }

  // ServeHandlerInfo is an optional parameter in Fresh 1.x
  export interface ServeHandlerInfo {
    remoteAddr: {
      hostname: string;
      port: number;
      transport: string;
    };
  }

  export type CreateHandlerReturn = (
    req: Request,
    connInfo?: ServeHandlerInfo,
  ) => Promise<Response>;
  export type CreateHandler = (
    manifest: Manifest,
  ) => Promise<CreateHandlerReturn>;

  export interface ServerModule {
    createHandler: CreateHandler;
  }
}

// Fresh 2.x types
export namespace Fresh2 {
  export interface App {
    all: (pattern: RoutePattern, handler: Handler) => App;
    build: () => (req: Request) => Promise<Response>;
  }

  export interface AppConstructor {
    new (): App;
  }

  export interface ServerModule {
    App: AppConstructor;
  }

  export interface TailwindPlugin {
    (): unknown;
  }
}
