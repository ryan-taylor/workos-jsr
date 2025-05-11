import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { WorkOS } from '../mod.ts';

Deno.test('WorkOS throws if apiKey is missing', () => {
  // @ts-expect-error: testing missing apiKey
  assertThrows(() => new WorkOS({}), Error, 'apiKey is required');
});

Deno.test('WorkOS instantiates with apiKey', () => {
  const w = new WorkOS({ apiKey: 'sk_test_123' });
  assertEquals(w.apiKey, 'sk_test_123');
  assertEquals(typeof w.httpClient, 'object');
  assertEquals(w.baseUrl, 'https://api.workos.com');
});

Deno.test('WorkOS allows custom baseUrl', () => {
  const w = new WorkOS({ apiKey: 'sk_test_123', baseUrl: 'https://custom.workos.com' });
  assertEquals(w.baseUrl, 'https://custom.workos.com');
});
