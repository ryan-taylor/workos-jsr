// Prometheus metrics endpoint
import type { Handlers } from "$fresh/server.ts";
import { formatMetricsAsPrometheus } from "../utils/telemetry.ts";

/**
 * Basic authentication middleware for protecting metrics
 */
function isAuthenticated(request: Request): boolean {
  // Get the Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  // Check if it's Basic auth
  if (!authHeader.startsWith("Basic ")) return false;

  // Extract credentials
  const base64Credentials = authHeader.slice("Basic ".length);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(":");

  // Check against environment variables or use defaults for development
  const expectedUsername = Deno.env.get("METRICS_USERNAME") ?? "admin";
  const expectedPassword = Deno.env.get("METRICS_PASSWORD") ?? "metrics";

  return username === expectedUsername && password === expectedPassword;
}

export const handler: Handlers = {
  GET(req) {
    // Check authentication
    if (!isAuthenticated(req)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Metrics Access", charset="UTF-8"',
        },
      });
    }

    // Get metrics in Prometheus format
    const metricsOutput = formatMetricsAsPrometheus();

    // Return with proper content type for Prometheus
    return new Response(metricsOutput, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  },
};

// No rendering needed for this endpoint - it only returns text
export default function MetricsPage() {
  return (
    <div>
      <h1>Metrics Endpoint</h1>
      <p>
        This page is meant to be accessed by Prometheus or similar monitoring
        tools.
      </p>
      <p>Please authenticate to access the metrics.</p>
    </div>
  );
}
