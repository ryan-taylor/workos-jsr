import type { FreshContext } from "../common/iron-session/fresh-session-provider.ts";
import type { MiddlewareHandler } from "./fresh-middleware.ts";

/**
 * Security options for the security middleware
 */
export interface SecurityOptions {
  /** Content Security Policy directives */
  csp?: {
    /** Default source directive */
    defaultSrc?: string[];
    /** Script source directive */
    scriptSrc?: string[];
    /** Style source directive */
    styleSrc?: string[];
    /** Connect source directive */
    connectSrc?: string[];
    /** Font source directive */
    fontSrc?: string[];
    /** Image source directive */
    imgSrc?: string[];
    /** Object source directive */
    objectSrc?: string[];
    /** Media source directive */
    mediaSrc?: string[];
    /** Frame source directive */
    frameSrc?: string[];
    /** Worker source directive */
    workerSrc?: string[];
    /** Manifest source directive */
    manifestSrc?: string[];
    /** Form action directive */
    formAction?: string[];
    /** Base URI directive */
    baseUri?: string[];
    /** Frame ancestors directive */
    frameAncestors?: string[];
    /** Report URI directive */
    reportUri?: string;
    /** Report To directive */
    reportTo?: string;
  };
  /** Cross-Origin-Embedder-Policy header */
  coep?: "require-corp" | "credentialless" | "unsafe-none";
  /** Cross-Origin-Opener-Policy header */
  coop?: "same-origin" | "same-origin-allow-popups" | "unsafe-none";
  /** Cross-Origin-Resource-Policy header */
  corp?: "same-origin" | "same-site" | "cross-origin";
  /** X-Content-Type-Options header */
  noSniff?: boolean;
  /** X-Frame-Options header */
  frameOptions?: "DENY" | "SAMEORIGIN";
  /** Referrer-Policy header */
  referrerPolicy?: string;
  /** Strict-Transport-Security header */
  hsts?: {
    /** Max age in seconds */
    maxAge?: number;
    /** Include subdomains */
    includeSubDomains?: boolean;
    /** Preload */
    preload?: boolean;
  };
  /** Permissions-Policy header */
  permissionsPolicy?: Record<string, string[]>;
}

/**
 * Default security options
 */
const defaultOptions: SecurityOptions = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
  },
  coep: "require-corp",
  coop: "same-origin",
  corp: "same-origin",
  noSniff: true,
  frameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * Create a security middleware for Fresh
 * @param options Security options
 * @returns A middleware handler
 */
export function createSecurityMiddleware(
  options: SecurityOptions = {},
): { handler: MiddlewareHandler } {
  // Merge options with defaults
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    csp: { ...defaultOptions.csp, ...options.csp },
    hsts: { ...defaultOptions.hsts, ...options.hsts },
  };

  return {
    handler: async (req: Request, ctx: FreshContext) => {
      // Process the request
      const response = await ctx.next();

      // Clone the response to add headers
      const headers = new Headers(response.headers);

      // Add Content-Security-Policy header
      if (mergedOptions.csp) {
        const cspDirectives: string[] = [];

        // Add CSP directives
        for (const [directive, sources] of Object.entries(mergedOptions.csp)) {
          if (sources && sources.length > 0) {
            // Convert camelCase to kebab-case
            const formattedDirective = directive.replace(
              /([a-z])([A-Z])/g,
              "$1-$2",
            ).toLowerCase();
            cspDirectives.push(
              `${formattedDirective} ${
                Array.isArray(sources) ? sources.join(" ") : sources
              }`,
            );
          }
        }

        if (cspDirectives.length > 0) {
          headers.set("Content-Security-Policy", cspDirectives.join("; "));
        }
      }

      // Add Cross-Origin-Embedder-Policy header
      if (mergedOptions.coep) {
        headers.set("Cross-Origin-Embedder-Policy", mergedOptions.coep);
      }

      // Add Cross-Origin-Opener-Policy header
      if (mergedOptions.coop) {
        headers.set("Cross-Origin-Opener-Policy", mergedOptions.coop);
      }

      // Add Cross-Origin-Resource-Policy header
      if (mergedOptions.corp) {
        headers.set("Cross-Origin-Resource-Policy", mergedOptions.corp);
      }

      // Add X-Content-Type-Options header
      if (mergedOptions.noSniff) {
        headers.set("X-Content-Type-Options", "nosniff");
      }

      // Add X-Frame-Options header
      if (mergedOptions.frameOptions) {
        headers.set("X-Frame-Options", mergedOptions.frameOptions);
      }

      // Add Referrer-Policy header
      if (mergedOptions.referrerPolicy) {
        headers.set("Referrer-Policy", mergedOptions.referrerPolicy);
      }

      // Add Strict-Transport-Security header
      if (mergedOptions.hsts) {
        const { maxAge, includeSubDomains, preload } = mergedOptions.hsts;
        let value = `max-age=${maxAge}`;
        if (includeSubDomains) {
          value += "; includeSubDomains";
        }
        if (preload) {
          value += "; preload";
        }
        headers.set("Strict-Transport-Security", value);
      }

      // Add Permissions-Policy header
      if (mergedOptions.permissionsPolicy) {
        const directives: string[] = [];
        for (
          const [feature, allowlist] of Object.entries(
            mergedOptions.permissionsPolicy,
          )
        ) {
          directives.push(
            `${feature}=(${
              Array.isArray(allowlist) ? allowlist.join(" ") : allowlist
            })`,
          );
        }
        if (directives.length > 0) {
          headers.set("Permissions-Policy", directives.join(", "));
        }
      }

      // Return a new response with the added headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}
