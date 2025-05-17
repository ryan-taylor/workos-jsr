/**
 * WorkOS SDK Telemetry Integration
 *
 * This module provides integration between the WorkOS SDK and the telemetry system,
 * automatically instrumenting key SDK operations.
 */

import { WorkOS } from "../workos.ts";
import {
  createCounter,
  createHistogram,
  createSpan,
  MetricType,
  type Span,
  SpanStatus,
  telemetry,
} from "../../../../src/common/telemetry/telemetry.ts";

// Telemetry options that can be passed to the WorkOS constructor
export interface WorkOSTelemetryOptions {
  // Whether telemetry is enabled
  enabled: boolean;

  // Optional endpoint for telemetry data (not used in current implementation)
  endpoint?: string;

  // Whether to enable debug logging
  debug?: boolean;
}

// HTTP methods that are instrumented
const HTTP_METHODS = ["get", "post", "put", "delete"] as const;
type HttpMethod = typeof HTTP_METHODS[number];

// Metrics for tracking API requests
let requestCounter: ReturnType<typeof createCounter>;
let requestDurationHistogram: ReturnType<typeof createHistogram>;

/**
 * Initialize telemetry for a WorkOS instance
 *
 * @param workos The WorkOS instance to instrument
 * @param options Telemetry options
 */
export function initTelemetry(
  workos: WorkOS,
  options?: Partial<WorkOSTelemetryOptions>,
): void {
  // Configure telemetry with defaults
  const telemetryOptions = options || {};

  telemetry.updateConfig({
    enabled: telemetryOptions.enabled ?? false,
    serviceName: `workos-deno-sdk-${workos.version}`,
    defaultAttributes: {
      "sdk.version": workos.version,
      "sdk.name": "workos-deno-sdk",
    },
    debug: telemetryOptions.debug ?? false,
  });

  // Early return if telemetry is disabled
  if (!telemetryOptions.enabled) {
    return;
  }

  console.log(`[WorkOS] Telemetry initialized for SDK v${workos.version}`);

  // Create metrics
  requestCounter = createCounter("workos.http.requests", 0, {
    description: "Total number of WorkOS API requests",
    unit: "requests",
  });

  requestDurationHistogram = createHistogram(
    "workos.http.duration",
    [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    {
      description: "Duration of WorkOS API requests in milliseconds",
      unit: "ms",
    },
  );

  // Instrument HTTP methods
  instrumentHttpMethods(workos);
}

/**
 * Instrument HTTP methods on a WorkOS instance
 *
 * @param workos The WorkOS instance to instrument
 */
function instrumentHttpMethods(workos: WorkOS): void {
  // Save original methods
  const originalMethods = {
    get: workos.get.bind(workos),
    post: workos.post.bind(workos),
    put: workos.put.bind(workos),
    delete: workos.delete.bind(workos),
  };

  // Instrument GET method
  workos.get = async function <Result = unknown>(
    path: string,
    options: any = {},
  ): Promise<{ data: Result }> {
    return await trackApiRequest<{ data: Result }>(
      "get",
      path,
      originalMethods.get,
      [path, options],
    );
  };

  // Instrument POST method
  workos.post = async function <Result = unknown, Entity = unknown>(
    path: string,
    entity: Entity,
    options: any = {},
  ): Promise<{ data: Result }> {
    return await trackApiRequest<{ data: Result }>(
      "post",
      path,
      originalMethods.post,
      [path, entity, options],
    );
  };

  // Instrument PUT method
  workos.put = async function <Result = unknown, Entity = unknown>(
    path: string,
    entity: Entity,
    options: any = {},
  ): Promise<{ data: Result }> {
    return await trackApiRequest<{ data: Result }>(
      "put",
      path,
      originalMethods.put,
      [path, entity, options],
    );
  };

  // Instrument DELETE method
  workos.delete = async function (
    path: string,
    options: any = {},
  ): Promise<void> {
    return await trackApiRequest("delete", path, originalMethods.delete, [
      path,
      options,
    ]);
  };
}

/**
 * Track an API request with telemetry
 *
 * @param method The HTTP method used
 * @param path The API path
 * @param originalMethod The original method to call
 * @param args Arguments to pass to the original method
 * @returns The result of the original method
 */
async function trackApiRequest<T>(
  method: HttpMethod,
  path: string,
  originalMethod: (...args: any[]) => Promise<T>,
  args: any[],
): Promise<T> {
  // Extract API resource from path
  const resource = extractResourceFromPath(path);

  // Create span for the request
  const span = createSpan(`workos.api.${method}`, {
    attributes: {
      "http.method": method,
      "http.url": path,
      "http.route": path,
      "resource.name": resource,
    },
  });

  // Start timing
  const startTime = Date.now();

  try {
    // Execute the original method
    const result = await originalMethod(...args);

    // Record success metrics
    recordRequestMetrics(method, path, resource, startTime, true);

    // Set span status to success
    span.setStatus(SpanStatus.OK);

    return result;
  } catch (error) {
    // Record error metrics
    recordRequestMetrics(method, path, resource, startTime, false);

    // Set span status to error with message
    span.setStatus(
      SpanStatus.ERROR,
      error instanceof Error ? error.message : String(error),
    );

    // Add error details to span
    span.addEvent("error", {
      "error.type": error instanceof Error ? error.constructor.name : "Unknown",
      "error.message": error instanceof Error ? error.message : String(error),
    });

    // Re-throw the error
    throw error;
  } finally {
    // End the span
    span.end();
  }
}

/**
 * Record metrics for an API request
 *
 * @param method The HTTP method used
 * @param path The API path
 * @param resource The API resource
 * @param startTime The request start time
 * @param success Whether the request was successful
 */
function recordRequestMetrics(
  method: HttpMethod,
  path: string,
  resource: string,
  startTime: number,
  success: boolean,
): void {
  // Calculate duration
  const duration = Date.now() - startTime;

  // Common attributes for metrics
  const attributes = {
    method,
    path,
    resource,
    success: String(success),
  };

  // Increment request counter
  requestCounter.add(1, attributes);

  // Record request duration
  requestDurationHistogram.record(duration, attributes);
  // Log in debug mode
  if (telemetry.isDebugEnabled()) {
    console.log(
      `[WorkOS Telemetry] ${method.toUpperCase()} ${path} - ${duration}ms - ${
        success ? "success" : "error"
      }`,
    );
  }
}

/**
 * Extract the resource name from a path
 *
 * @param path The API path
 * @returns The resource name
 */
function extractResourceFromPath(path: string): string {
  // Remove leading slash and split by slash
  const parts = path.replace(/^\/+/, "").split("/");

  // Return the first part as the resource
  return parts[0] || "unknown";
}
