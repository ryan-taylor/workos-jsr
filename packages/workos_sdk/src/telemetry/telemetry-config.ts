/**
 * Configuration options for the WorkOS SDK telemetry system.
 */
export interface TelemetryConfig {
  /**
   * Whether telemetry is enabled.
   * @default false
   */
  enabled: boolean;

  /**
   * The endpoint to send telemetry data to.
   * @default 'http://localhost:4318'
   */
  endpoint: string;

  /**
   * The name of the service to use in telemetry data.
   * @default 'workos-node'
   */
  serviceName: string;

  /**
   * The version of the service to use in telemetry data.
   * Defaults to the SDK version.
   */
  serviceVersion?: string;

  /**
   * Additional attributes to include with all telemetry data.
   */
  attributes?: Record<string, string>;
}
