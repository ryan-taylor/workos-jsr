/**
 * Telemetry module for the WorkOS SDK
 *
 * This module provides OpenTelemetry instrumentation for the WorkOS SDK.
 */

export * from "./telemetry-config.ts.ts";
export * from "./telemetry-manager.ts.ts";
export * from "./otlp-exporter.ts.ts";
export * from "./workos-integration.ts.ts";

// Re-export the default telemetry instance
export { telemetry } from "./telemetry-manager.ts.ts";
