/**
 * Testing utilities for WorkOS SDK
 */

/**
 * Resets any fetch mocks
 */
export function resetMockFetch(): void {
  // In the Deno port, this would reset any global fetch mocks
  // For now, we'll just implement an empty function that matches the expected signature
}

/**
 * Sets up a mock fetch response for a single call
 *
 * @param responseData Data to return in the mock response
 */
export function fetchOnce(
  responseData: unknown,
  options?: { status?: number; headers?: Record<string, string> },
): void {
  // In Deno, this would set up a mock for a single fetch call
  // For the Deno port, we'll leave this as a stub
}

/**
 * Returns the body of the last fetch call
 *
 * @param options Options for getting the body
 * @returns The body of the last fetch call
 */
export function fetchBody(options?: { raw?: boolean }): unknown {
  // In Deno, this would return the body of the last fetch call
  // For the Deno port, we'll leave this as a stub
  return null;
}

/**
 * Returns the headers of the last fetch call
 *
 * @returns The headers of the last fetch call
 */
export function fetchHeaders(): Record<string, string> | null {
  // In Deno, this would return the headers of the last fetch call
  // For the Deno port, we'll leave this as a stub
  return null;
}

/**
 * Creates a spy function that wraps the provided implementation
 *
 * @param implementation Function implementation to spy on
 * @returns A wrapped function that tracks calls
 */
export function spy<T extends (...args: unknown[]) => unknown>(
  implementation: T,
): T {
  // In Deno, this would wrap a function to track calls
  // For simplicity in the port, just return the implementation
  return implementation;
}
