/**
 * WorkOS Telemetry Integration
 * This file provides functions to initialize and manage telemetry for the WorkOS SDK
 */

import type { WorkOS } from "../workos.ts";
import type { TelemetryConfig } from "./telemetry-config.ts";

/**
 * Initializes telemetry for the WorkOS SDK
 * @param workos The WorkOS instance
 * @param config Telemetry configuration options
 */
export function initTelemetry(
  workos: WorkOS,
  config: Partial<TelemetryConfig>,
): void {
  // This is a stub implementation that will be expanded in the future
  // For now, we just log that telemetry is enabled if it's enabled
  if (config.enabled) {
    console.log(
      `WorkOS SDK telemetry enabled. Endpoint: ${
        config.endpoint || "http://localhost:4318"
      }`,
    );
  }
}
