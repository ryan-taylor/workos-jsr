/**
 * WorkOS SDK Deno Test Lifecycle Utilities
 *
 * This module provides utilities for test setup and teardown operations
 * following Deno's native patterns.
 */

/**
 * A handler for cleanup operations
 */
export type CleanupHandler = () => void | Promise<void>;

/**
 * A registry for tracking cleanup operations to be performed after tests
 */
export class TestCleanup {
  private cleanupHandlers: CleanupHandler[] = [];

  /**
   * Register a cleanup operation to be performed later
   *
   * @param handler The cleanup function to register
   */
  add(handler: CleanupHandler): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Run all registered cleanup operations
   */
  async runAll(): Promise<void> {
    // Run cleanup handlers in reverse order (last registered, first executed)
    for (let i = this.cleanupHandlers.length - 1; i >= 0; i--) {
      await this.cleanupHandlers[i]();
    }
    this.cleanupHandlers = [];
  }
}

/**
 * A class for managing test environment setup and teardown
 */
export class TestEnvironment {
  private cleanupRegistry = new TestCleanup();

  /**
   * Register a cleanup operation
   *
   * @param handler The cleanup function to register
   */
  registerCleanup(handler: CleanupHandler): void {
    this.cleanupRegistry.add(handler);
  }

  /**
   * Register a resource to be closed after tests
   *
   * @param resource A resource with a close method
   */
  trackResource(resource: { close: () => void | Promise<void> }): void {
    this.registerCleanup(() => resource.close());
  }

  /**
   * Create a temporary file that will be cleaned up after tests
   *
   * @param options Options for the temporary file
   * @returns The path to the created temporary file
   */
  async createTempFile(options: {
    prefix?: string;
    suffix?: string;
    dir?: string;
    content?: string;
  } = {}): Promise<string> {
    const tempFile = await Deno.makeTempFile({
      prefix: options.prefix,
      suffix: options.suffix,
      dir: options.dir,
    });

    if (options.content) {
      await Deno.writeTextFile(tempFile, options.content);
    }

    this.registerCleanup(async () => {
      try {
        await Deno.remove(tempFile);
      } catch (error) {
        // Ignore errors if file is already gone
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    });

    return tempFile;
  }

  /**
   * Create a temporary directory that will be cleaned up after tests
   *
   * @param options Options for the temporary directory
   * @returns The path to the created temporary directory
   */
  async createTempDir(options: {
    prefix?: string;
    suffix?: string;
    dir?: string;
  } = {}): Promise<string> {
    const tempDir = await Deno.makeTempDir({
      prefix: options.prefix,
      suffix: options.suffix,
      dir: options.dir,
    });

    this.registerCleanup(async () => {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (error) {
        // Ignore errors if directory is already gone
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    });

    return tempDir;
  }

  /**
   * Set an environment variable for the duration of the test
   *
   * @param key The environment variable name
   * @param value The value to set
   */
  setEnv(key: string, value: string): void {
    const originalValue = Deno.env.get(key);
    Deno.env.set(key, value);

    this.registerCleanup(() => {
      if (originalValue === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, originalValue);
      }
    });
  }

  /**
   * Create a server for testing HTTP clients
   *
   * @param handler The request handler
   * @param options Server options
   * @returns The URL of the server
   */
  async createTestServer(
    handler: (req: Request) => Response | Promise<Response>,
    options: { port?: number } = {},
  ): Promise<string> {
    const port = options.port || 0; // Port 0 means random available port
    const controller = new AbortController();
    const { signal } = controller;

    const server = Deno.serve({ port, signal }, handler);

    // Extract the actual port from the server
    const serverAddress = server.addr as Deno.NetAddr;
    const url = `http://localhost:${serverAddress.port}`;

    this.registerCleanup(() => {
      controller.abort();
      return server.finished;
    });

    return url;
  }

  /**
   * Run cleanup operations
   */
  async runCleanup(): Promise<void> {
    await this.cleanupRegistry.runAll();
  }
}

/**
 * Create a test wrapper function that manages environment setup/teardown
 *
 * @param setupFn Optional function to initialize test environment
 * @returns A function that wraps a test function with environment management
 */
export function withTestEnv(
  setupFn?: (env: TestEnvironment) => void | Promise<void>,
): (
  testFn: (t: Deno.TestContext, env: TestEnvironment) => void | Promise<void>,
) => (t: Deno.TestContext) => Promise<void> {
  return (testFn) => async (t: Deno.TestContext) => {
    const env = new TestEnvironment();

    try {
      if (setupFn) {
        await setupFn(env);
      }

      await testFn(t, env);
    } finally {
      await env.runCleanup();
    }
  };
}

/**
 * Example usage:
 *
 * ```ts
 * import { withTestEnv } from "./test-lifecycle.ts";
 *
 * // Create a test with automatic environment setup/teardown
 * const withTestApi = withTestEnv(async (env) => {
 *   // Setup common resources for all tests
 *   env.setEnv("WORKOS_API_KEY", "test_api_key");
 *
 *   // Create a mock server
 *   const serverUrl = await env.createTestServer((req) => {
 *     return new Response("OK", { status: 200 });
 *   });
 *
 *   env.setEnv("WORKOS_API_URL", serverUrl);
 * });
 *
 * // Use the test wrapper
 * Deno.test("my test", withTestApi(async (t, env) => {
 *   // Create test-specific resources
 *   const tempFile = await env.createTempFile({
 *     content: "test data"
 *   });
 *
 *   // Rest of the test...
 *   // All cleanup happens automatically
 * }));
 * ```
 */
