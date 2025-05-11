/**
 * Fresh compatibility layer for context
 * This file exports the FreshContext type based on the DENO_FRESH_VERSION environment variable
 */

// Define a generic FreshContext type that works with both Fresh 1.x and 2.x
// The structure is similar enough between versions that we can use a common interface
export interface FreshContext<State = Record<string, unknown>, Data = unknown, Params = Record<string, string>> {
  req: Request;
  url: URL;
  params: Params;
  state: State;
  data: Data;
  render: (data?: Data) => Promise<Response>;
}