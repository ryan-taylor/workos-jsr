/**
 * Telemetry module for the WorkOS SDK
 *
 * This module provides OpenTelemetry instrumentation for the WorkOS SDK.
 */

export * from "./telemetry-config.ts";
export * from "./telemetry-manager.ts";
export * from "./otlp-exporter.ts";
export * from "./workos-integration.ts";

// Re-export the default telemetry instance
export { telemetry } from "./telemetry-manager.ts";
