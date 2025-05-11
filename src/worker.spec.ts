// Import Deno standard testing library
import { assertEquals } from '@std/assert';

import { WorkOS } from './index.worker.ts';

// WorkOS - initialization is successful
Deno.test('WorkOS - initialization is successful', () => {
  // If initialization throws, the test will fail automatically
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  assertEquals(typeof workos, 'object', 'WorkOS should be initialized as an object');
});
