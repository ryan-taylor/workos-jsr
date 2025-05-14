import type { Handlers, PageProps } from "$fresh/server.ts";
import TelemetryDashboard from "../islands/TelemetryDashboard.tsx";

export default function TelemetryPage() {
  return (
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-3xl font-bold mb-8">WorkOS SDK Telemetry</h1>
      <p class="mb-6 text-gray-700">
        This dashboard provides real-time metrics on WorkOS SDK operations. The
        data displayed here is for demonstration purposes and uses simulated
        values. In a production environment, this would display actual telemetry
        data collected from your application's usage of the WorkOS SDK.
      </p>

      <div class="mt-8">
        <TelemetryDashboard />
      </div>

      <div class="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600">
        <h2 class="text-xl font-semibold mb-4">
          About OpenTelemetry Integration
        </h2>
        <p class="mb-3">
          The WorkOS SDK includes built-in OpenTelemetry support for monitoring
          and observability. This allows you to track important metrics like:
        </p>
        <ul class="list-disc pl-6 mb-4 space-y-1">
          <li>API call volume and success rates</li>
          <li>Authentication attempts and success rates</li>
          <li>Operation latency and performance</li>
          <li>Usage patterns across different SDK modules</li>
        </ul>
        <p>
          Telemetry data can be exported to any OpenTelemetry-compatible backend
          for storage, visualization, and alerting. Supported backends include
          Prometheus, Jaeger, Honeycomb, DataDog, and more.
        </p>
      </div>
    </div>
  );
}
