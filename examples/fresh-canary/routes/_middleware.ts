import type { Handlers } from "$fresh/server.ts";
import {
  createSessionMiddleware,
  type MiddlewareHandler,
} from "workos_internal/mod.ts";
import { createSpan, recordMetric } from "../utils/telemetry.ts";
import { SESSION_OPTIONS } from "../utils/user-management.ts";

// Create session middleware compatible with both Fresh 1.x and 2.x
const sessionMiddlewareObj = createSessionMiddleware(SESSION_OPTIONS);
const sessionMiddleware = "handler" in sessionMiddlewareObj
  ? sessionMiddlewareObj.handler
  : sessionMiddlewareObj as MiddlewareHandler;

/**
 * Telemetry middleware to track request metrics
 */
const telemetryMiddleware: MiddlewareHandler = async (req, ctx) => {
  const requestStartTime = performance.now();
  const url = new URL(req.url);
  const path = url.pathname;

  // Track the page view
  recordMetric("page_views", 1, {
    path,
    method: req.method,
  });

  // Create a span for this request
  return await createSpan(
    `HTTP ${req.method} ${path}`,
    async () => {
      // Continue to the next middleware or route handler
      const resp = await ctx.next();

      // Record response metrics after the request completes
      const requestEndTime = performance.now();
      const duration = requestEndTime - requestStartTime;

      // Record timing and request details
      recordMetric("http_response_time", duration, {
        path,
        method: req.method,
        status: resp.status.toString(),
      });

      // Count the request
      recordMetric("http_requests_total", 1, {
        path,
        method: req.method,
        status: resp.status.toString(),
      });

      // Return the response
      return resp;
    },
    {
      path,
      method: req.method,
      userAgent: req.headers.get("user-agent") || "unknown",
    },
  );
};

// Combine session and telemetry middleware
export const handler: Handlers = {
  async GET(req, ctx) {
    // First apply telemetry middleware
    const resp = await telemetryMiddleware(req, ctx);
    if (resp) return resp;

    // Then apply session middleware
    return await sessionMiddleware(req, ctx);
  },
  async POST(req, ctx) {
    // First apply telemetry middleware
    const resp = await telemetryMiddleware(req, ctx);
    if (resp) return resp;

    // Then apply session middleware
    return await sessionMiddleware(req, ctx);
  },
  async PUT(req, ctx) {
    // First apply telemetry middleware
    const resp = await telemetryMiddleware(req, ctx);
    if (resp) return resp;

    // Then apply session middleware
    return await sessionMiddleware(req, ctx);
  },
  async DELETE(req, ctx) {
    // First apply telemetry middleware
    const resp = await telemetryMiddleware(req, ctx);
    if (resp) return resp;

    // Then apply session middleware
    return await sessionMiddleware(req, ctx);
  },
};
