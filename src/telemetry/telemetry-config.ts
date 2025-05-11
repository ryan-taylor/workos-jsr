/**
 * Telemetry configuration for the WorkOS SDK
 *
 * This module provides configuration options for OpenTelemetry integration.
 */

/**
 * Configuration options for the SDK telemetry
 */
export interface TelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;

  /** OTLP exporter endpoint (default: http://localhost:4318) */
  endpoint?: string;

  /** Service name for telemetry (default: workos-sdk) */
  serviceName?: string;

  /** Additional attributes to include with all telemetry data */
  defaultAttributes?: Record<string, string>;

  /** Debug mode - enables additional logging */
  debug?: boolean;
}

/**
 * Default telemetry configuration
 */
export const defaultTelemetryConfig: TelemetryConfig = {
  enabled: false,
  endpoint: 'http://localhost:4318',
  serviceName: 'workos-sdk',
  defaultAttributes: {},
  debug: false,
};
