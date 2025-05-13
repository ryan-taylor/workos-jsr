/**
 * Integration of telemetry with the WorkOS class
 */

import type { WorkOS } from "../workos.ts.ts";
import {
  defaultTelemetryConfig,
  type TelemetryConfig,
} from "./telemetry-config.ts.ts";
import { telemetry, TelemetryManager } from "./telemetry-manager.ts.ts";
import {
  instrumentDirectorySync,
  instrumentSSO,
  instrumentUserManagement,
  instrumentWorkOSCore,
} from "./instrumentation.ts.ts";

/**
 * Initializes telemetry for a WorkOS instance
 *
 * @param workos - The WorkOS instance to instrument
 * @param config - Optional telemetry configuration override
 */
export function initTelemetry(
  workos: WorkOS,
  config?: Partial<TelemetryConfig>,
): void {
  // Initialize telemetry with merged config
  const mergedConfig: TelemetryConfig = {
    ...defaultTelemetryConfig,
    ...config || {},
    // Add a default attribute with SDK version
    defaultAttributes: {
      ...(config?.defaultAttributes || {}),
      "sdk.version": workos.version,
      "sdk.name": "@workos/sdk",
    },
  };

  // Create a new telemetry manager with the merged config
  const newTelemetryManager = new TelemetryManager(mergedConfig);

  // Replace the global telemetry instance's properties
  Object.keys(newTelemetryManager).forEach((key) => {
    (telemetry as any)[key] = (newTelemetryManager as any)[key];
  });

  // Only apply instrumentation if telemetry is enabled
  if (mergedConfig.enabled) {
    // Apply instrumentation to core HTTP methods
    instrumentWorkOSCore(workos);

    // Apply instrumentation to modules
    instrumentSSO(workos.sso);
    instrumentDirectorySync(workos.directorySync);
    instrumentUserManagement(workos.userManagement);

    if (mergedConfig.debug) {
      console.debug(
        `[WorkOS Telemetry] Telemetry initialized with endpoint: ${mergedConfig.endpoint}`,
      );
    }
  }
}
