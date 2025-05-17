/**
 * Telemetry module for WorkOS Deno SDK
 * 
 * This module provides instrumentation capabilities for tracking metrics and spans
 * in long-running Deno server processes using the WorkOS SDK.
 */

// Re-export all telemetry components
export * from "./telemetry.ts";
export * from "./telemetry-config.ts";
export { formatMetricsAsPrometheus, createPrometheusHandler } from "./exporters/prometheus.ts";