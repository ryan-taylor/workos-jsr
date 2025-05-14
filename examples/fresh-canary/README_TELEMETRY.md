# WorkOS SDK Telemetry Integration

This guide explains how to use and configure the built-in OpenTelemetry
integration in the WorkOS SDK.

## Overview

The WorkOS SDK includes an OpenTelemetry integration that allows you to monitor:

- API call volumes and latencies
- Authentication attempts and success rates
- Operation performance across different SDK modules
- Error rates and types

Telemetry data is exported using the OpenTelemetry Protocol (OTLP) over HTTP,
which can be collected by any OTLP-compatible backend.

## Enabling Telemetry

### Basic Configuration

To enable telemetry, provide configuration when initializing the WorkOS client:

```typescript
import { WorkOS } from "@workos/sdk";

const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? undefined,
    telemetry: {
      enabled: true, // Enable telemetry
      endpoint: "http://localhost:4318", // OTLP exporter endpoint
      serviceName: "my-fresh-application", // Service name for metrics
    },
  },
);
```

### Configuration Options

The telemetry module supports the following configuration:

| Option              | Description                                  | Default                 |
| ------------------- | -------------------------------------------- | ----------------------- |
| `enabled`           | Enable/disable telemetry collection          | `false`                 |
| `endpoint`          | OTLP HTTP exporter endpoint                  | `http://localhost:4318` |
| `serviceName`       | Service name for telemetry                   | `workos-sdk`            |
| `defaultAttributes` | Additional attributes for all telemetry data | `{}`                    |
| `debug`             | Enable debug logging for telemetry           | `false`                 |

### Adding Custom Attributes

You can add custom attributes to all telemetry data:

```typescript
const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? undefined,
    telemetry: {
      enabled: true,
      endpoint: "http://localhost:4318",
      serviceName: "my-fresh-application",
      defaultAttributes: {
        "environment": "production",
        "deployment.version": "1.2.3",
        "region": "us-west",
      },
    },
  },
);
```

## Instrumented Operations

The following WorkOS SDK operations are automatically instrumented:

### HTTP Core Methods

- GET requests to WorkOS API
- POST requests to WorkOS API
- PUT requests to WorkOS API
- DELETE requests to WorkOS API

### SSO Module

- `getAuthorizationUrl` - Tracking authentication attempts
- `getProfile` - Tracking profile fetches

### Directory Sync Module

- `listUsers` - Tracking directory user queries
- Group operations

### User Management Module

- `authenticateWithPassword` - Tracking authentication attempts and success
  rates
- Other authentication methods

Each operation generates spans with relevant attributes and metrics.

## Built-in Telemetry Dashboard

The WorkOS SDK includes a built-in telemetry dashboard for Fresh applications.
To use it:

1. Add the dashboard to your application by copying `TelemetryDashboard.tsx` to
   your islands directory
2. Create a route to display the dashboard:

```typescript
// routes/telemetry.tsx
import { PageProps } from "$fresh/server.ts";
import TelemetryDashboard from "../islands/TelemetryDashboard.tsx";

export default function TelemetryPage() {
  return (
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-3xl font-bold mb-8">WorkOS SDK Telemetry</h1>
      <TelemetryDashboard />
    </div>
  );
}
```

3. Navigate to `/telemetry` in your application.

The dashboard shows:

- Active users count
- Authentication success rate
- API call volume and success rate
- Average response time
- API call history chart
- Operations by module breakdown

## Setting Up an OpenTelemetry Collector

For production use, you'll want to set up an OpenTelemetry Collector to receive
and process telemetry data.

### Docker Compose Setup

Here's a simple docker-compose configuration for an OpenTelemetry Collector with
Prometheus and Jaeger:

```yaml
# docker-compose.yml
version: "3"
services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4318:4318" # OTLP HTTP receiver
      - "8889:8889" # Prometheus exporter
    depends_on:
      - jaeger
      - prometheus

  # Jaeger for trace visualization
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # Jaeger UI
      - "14250:14250" # Receiver for otel-collector

  # Prometheus for metrics storage
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    depends_on:
      - prometheus
```

### OpenTelemetry Collector Configuration

Create an `otel-collector-config.yaml` file:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```

### Prometheus Configuration

Create a `prometheus.yml` file:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "otel-collector"
    scrape_interval: 5s
    static_configs:
      - targets: ["otel-collector:8889"]
```

## Creating Custom Dashboards

Once you have data flowing into your telemetry backend, you can create custom
dashboards in Grafana.

### Example Grafana Dashboard Queries

#### Authentication Success Rate

```
sum(rate(workos_user_management_authentication_attempts{result="success"}[5m])) / 
sum(rate(workos_user_management_authentication_attempts[5m])) * 100
```

#### API Latency by Endpoint

```
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="workos-sdk"}[5m])) by (le, path))
```

## Troubleshooting

### Common Issues

1. **No data in collector**: Ensure telemetry is enabled and the endpoint is
   correct
2. **Connection refused**: Check if the collector is running and accessible
3. **Missing metrics**: Verify that the instrumented operations are being used

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
const workos = new WorkOS(
  Deno.env.get("WORKOS_API_KEY") ?? "",
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? undefined,
    telemetry: {
      enabled: true,
      endpoint: "http://localhost:4318",
      debug: true, // Enable debug logging
    },
  },
);
```

This will log detailed information about spans, metrics, and export operations.

## Advanced Topics

### Custom Instrumentation

You can access the telemetry manager for custom instrumentation:

```typescript
import { telemetry } from "@workos/sdk/telemetry";

// Create a custom span
const spanId = telemetry.startSpan("custom.operation", {
  "custom.attribute": "value",
});

try {
  // Do something
  telemetry.endSpan(spanId);
} catch (error) {
  telemetry.endSpan(spanId, SpanStatus.ERROR, error.message);
  throw error;
}

// Record a custom metric
telemetry.recordMetric("custom.counter", 1, "counter", {
  "custom.dimension": "value",
});
```

### Producing Custom Telemetry Reports

For generating custom reports, consider exporting the telemetry data to:

1. Elasticsearch for log analysis
2. DataDog for comprehensive monitoring
3. New Relic for application performance monitoring
4. Google Cloud Operations Suite

Each platform has specific exporters that can be configured in the OpenTelemetry
Collector.
