/**
 * Configuration options for the WorkOS Telemetry system
 */

export interface TelemetryConfig {
  /**
   * Whether telemetry is enabled
   * When disabled, all telemetry operations become no-ops
   */
  enabled: boolean;
  
  /**
   * Name of the service, used as a label on metrics and spans
   */
  serviceName: string;
  
  /**
   * Default attributes to attach to all metrics and spans
   */
  defaultAttributes: Record<string, string | number | boolean>;
  
  /**
   * Whether to enable debug logging for telemetry operations
   */
  debug: boolean;
}