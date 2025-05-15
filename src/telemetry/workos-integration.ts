/**
 * Integration of telemetry with the WorkOS class
 */

import type { WorkOS } from "../workos.ts";
import {
  defaultTelemetryConfig,
  type TelemetryConfig,
} from "./telemetry-config.ts";
import { telemetry, TelemetryManager } from "./telemetry-manager.ts";
import {
  instrumentDirectorySync,
  instrumentSSO,
  instrumentUserManagement,
  instrumentWorkOSCore,
} from "./instrumentation.ts";
import type { SSO } from "../sso/sso.ts";
import type { DirectorySync } from "../directory-sync/directory-sync.ts";
import type { UserManagement } from "../user-management/user-management.ts";

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
  // Using unknown to safely assign properties between telemetry instances
  Object.keys(newTelemetryManager).forEach((key) => {
    (telemetry as unknown as Record<string, unknown>)[key] =
      (newTelemetryManager as unknown as Record<string, unknown>)[key];
  });

  // Only apply instrumentation if telemetry is enabled
  if (mergedConfig.enabled) {
    // Apply instrumentation to core HTTP methods
    instrumentWorkOSCore(workos);

    // Apply instrumentation to modules
    // Use type assertions to handle compatibility between package and source implementations
    instrumentSSO(workos.sso as unknown as SSO);
    instrumentDirectorySync(workos.directorySync as unknown as DirectorySync);
    instrumentUserManagement(
      workos.userManagement as unknown as UserManagement,
    );

    if (mergedConfig.debug) {
      console.debug(
        `[WorkOS Telemetry] Telemetry initialized with endpoint: ${mergedConfig.endpoint}`,
      );
    }
  }
}
