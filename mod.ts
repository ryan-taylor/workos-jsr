import { WorkOS as BaseWorkOS } from "./src/workos.ts";
import { FreshSessionProvider } from "./src/common/iron-session/fresh-session-provider.ts";

/**
 * WorkOS class extended for Deno and Fresh, using the FreshSessionProvider
 * instead of the default iron-session implementation.
 */
export class WorkOS extends BaseWorkOS {
  /**
   * Override the createIronSessionProvider method to use our Fresh-native implementation
   * instead of the default implementation that throws an error.
   */
  override createIronSessionProvider() {
    return new FreshSessionProvider();
  }
}

// Re-export everything else from the original WorkOS module
export * from "./src/workos.ts";