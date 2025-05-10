import { assertEquals, assertRejects } from '@std/assert';
import { HttpClient, HttpClientError } from '../src/core/http_client.ts';

Deno.test('HttpClient: successful JSON GET', async () => {
  // Use a public echo API for demonstration; in real tests, use a local server or mock
  const client = new HttpClient();
  const url = 'https://httpbin.org/json';
  const data = await client.request(url);
  // httpbin returns a JSON object with a 'slideshow' key
  assertEquals(typeof data, 'object');
  if (typeof data === 'object' && data !== null) {
    if (!('slideshow' in data)) throw new Error('Missing slideshow key');
  }
});

Deno.test('HttpClient: 404 error handling', async () => {
  const client = new HttpClient();
  const url = 'https://httpbin.org/status/404';
  await assertRejects(
    () => client.request(url),
    HttpClientError,
    'HTTP 404'
  );
});

Deno.test('HttpClient: network error handling', async () => {
  const client = new HttpClient();
  // Invalid domain to force a network error
  const url = 'https://nonexistent.workos-deno-test';
  await assertRejects(
    () => client.request(url),
    HttpClientError,
    'Network error'
  );
}); 