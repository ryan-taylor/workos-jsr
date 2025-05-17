/**
 * WorkOS Telemetry Demo
 *
 * This example demonstrates how to use the WorkOS Deno SDK telemetry module
 * to monitor long-running processes and export metrics in Prometheus format.
 *
 * To run this example:
 * ```
 * deno run --allow-net --allow-env examples/telemetry-demo.ts
 * ```
 *
 * Then visit:
 * - http://localhost:8000/ - to trigger various operations
 * - http://localhost:8000/metrics - to see the Prometheus metrics
 */

import { serve } from "https://deno.land/std/http/server.ts";
import { WorkOS } from "../packages/workos_sdk/mod.ts";
import {
  createCounter,
  createGauge,
  createHistogram,
  createPrometheusHandler,
  createSpan,
  formatMetricsAsPrometheus,
  MetricType,
  SpanStatus,
  telemetry,
} from "../src/common/telemetry/index.ts";

// Initialize WorkOS with telemetry enabled
const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "sk_test_example", {
  telemetry: {
    enabled: true,
  },
});

// Configure telemetry with debug mode
telemetry.updateConfig({
  enabled: true,
  serviceName: "workos-telemetry-demo",
  debug: true,
  defaultAttributes: {
    "application": "telemetry-demo",
  },
});

// Create some standalone metrics
const requestCounter = createCounter("app.requests", 0, {
  description: "Total number of requests to the demo application",
  unit: "requests",
});

const activeConnections = createGauge("app.connections.active", {
  description: "Number of active connections",
  unit: "connections",
});

const requestDuration = createHistogram(
  "app.request.duration",
  [5, 10, 25, 50, 100, 250, 500, 1000],
  {
    description: "Duration of requests in milliseconds",
    unit: "ms",
  },
);

/**
 * Main HTTP handler function
 */
async function handler(request: Request): Promise<Response> {
  // Extract path from URL
  const url = new URL(request.url);
  const path = url.pathname;

  // Track basic request metrics
  const requestStartTime = Date.now();
  requestCounter.add(1, { path });

  // Simulate active connections
  const connectionCount = Math.floor(Math.random() * 10) + 1;
  activeConnections.set(connectionCount);

  // Create a span for the request
  const span = createSpan("http.request", {
    attributes: {
      "http.method": request.method,
      "http.url": request.url,
      "http.path": path,
    },
  });

  try {
    // Handle different routes
    switch (path) {
      case "/metrics":
        // Export metrics in Prometheus format
        return await handleMetricsRequest();

      case "/api/users":
        // Simulate fetching users from WorkOS
        return await handleUsersRequest(span);

      case "/error":
        // Simulate an error
        return await handleErrorRequest(span);

      default:
        // Default route - show links to demo endpoints
        return await handleDefaultRoute(span);
    }
  } catch (error) {
    // Handle any errors
    console.error("Error handling request:", error);
    span.setStatus(
      SpanStatus.ERROR,
      error instanceof Error ? error.message : String(error),
    );
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    // Complete the span
    span.end();

    // Record request duration
    const duration = Date.now() - requestStartTime;
    requestDuration.record(duration, { path });

    console.log(`Request to ${path} completed in ${duration}ms`);
  }
}

/**
 * Handle metrics endpoint request
 */
async function handleMetricsRequest(): Promise<Response> {
  // Get all metrics from telemetry
  const metrics = telemetry.getAllMetrics();

  // Format metrics in Prometheus format
  const formattedMetrics = formatMetricsAsPrometheus(metrics);

  // Return metrics
  return new Response(formattedMetrics, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * Handle users API request
 */
async function handleUsersRequest(parentSpan: any): Promise<Response> {
  // Create child span for database operation
  const dbSpan = createSpan("db.query", {
    attributes: {
      "db.operation": "select",
      "db.table": "users",
    },
    parentSpanId: parentSpan.id,
  });

  try {
    // Simulate database query
    await simulateDelay(50, 150);
    dbSpan.setStatus(SpanStatus.OK);
  } finally {
    dbSpan.end();
  }

  // Create child span for WorkOS API call
  const apiSpan = createSpan("workos.api.call", {
    attributes: {
      "api.name": "workos",
      "api.endpoint": "/directory-sync/users",
    },
    parentSpanId: parentSpan.id,
  });

  try {
    // Use WorkOS SDK to simulate fetching users
    // This is a simulated call since we likely don't have a valid API key
    try {
      await workos.directorySync.listUsers({ limit: 10 });
    } catch (e) {
      // Expected to fail with invalid API key, but telemetry will still be captured
      console.log("Expected WorkOS API error (using test key)");
    }

    apiSpan.setStatus(SpanStatus.OK);
    parentSpan.setStatus(SpanStatus.OK);

    return new Response(
      JSON.stringify({
        users: [
          { id: 1, name: "Alice", email: "alice@example.com" },
          { id: 2, name: "Bob", email: "bob@example.com" },
        ],
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } finally {
    apiSpan.end();
  }
}

/**
 * Handle error request
 */
async function handleErrorRequest(span: any): Promise<Response> {
  // Simulate process that results in error
  await simulateDelay(50, 100);

  // Simulate error
  const error = new Error("Simulated error for demonstration");
  span.setStatus(SpanStatus.ERROR, error.message);

  // Return error response
  return new Response("Simulated Error Occurred", { status: 500 });
}

/**
 * Handle default route
 */
async function handleDefaultRoute(span: any): Promise<Response> {
  // Simulate delay
  await simulateDelay(10, 50);
  span.setStatus(SpanStatus.OK);

  // Return HTML with links to demo endpoints
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WorkOS Telemetry Demo</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .endpoint { margin-bottom: 20px; }
          .endpoint h2 { margin-bottom: 5px; }
          .endpoint p { margin-top: 0; }
          a { color: #0066cc; }
        </style>
      </head>
      <body>
        <h1>WorkOS Telemetry Demo</h1>
        <p>This demo shows how to use the WorkOS SDK telemetry module.</p>
        
        <div class="endpoint">
          <h2>Demo Endpoints:</h2>
          <ul>
            <li><a href="/api/users">/api/users</a> - Simulates fetching users with nested spans</li>
            <li><a href="/error">/error</a> - Simulates an error condition</li>
            <li><a href="/metrics">/metrics</a> - View Prometheus metrics</li>
          </ul>
        </div>
        
        <div class="endpoint">
          <h2>Current Metrics:</h2>
          <p>Visit the <a href="/metrics">/metrics</a> endpoint to see all metrics in Prometheus format.</p>
          <p>Request Count: ${requestCounter.get()} requests</p>
          <p>Active Connections: ${activeConnections.get()} connections</p>
        </div>
      </body>
    </html>
  `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
}

/**
 * Simulate delay with random variation
 */
async function simulateDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Start the server
 */
async function startServer() {
  console.log("Starting telemetry demo server...");
  console.log("Visit http://localhost:8000/ to test the demo");
  console.log("Visit http://localhost:8000/metrics to see Prometheus metrics");

  await serve(handler, { port: 8000 });
}

// Start the server
startServer();
