// Import Deno testing utilities
import {
  expect,
  it,
} from "../tests/deno-test-setup.ts";

import { WorkOS } from './index.worker.ts';

// Main test
it('WorkOS is initialized without errors', () => {
  expect(() => new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU')).not.toThrow();
});
