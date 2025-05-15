// Simple file to check the telemetry instrumentation fixes
import { instrumentWorkOSCore } from "./src/telemetry/instrumentation.ts";
import { type WorkOS } from "./src/workos.ts";

// Create a mock WorkOS instance with minimal implementation
const mockWorkOS = {
  get: (path: string, _options = {}) => Promise.resolve({}),
  post: (path: string, entity: unknown, _options = {}) => Promise.resolve({}),
  put: (path: string, entity: unknown, _options = {}) => Promise.resolve({}),
  delete: (path: string, _query = {}) => Promise.resolve(),
} as WorkOS;

// This should work with our fixed type definitions
instrumentWorkOSCore(mockWorkOS);

console.log("Telemetry type check completed successfully");
