import { assertEquals, assertExists, assertRejects, assertStringIncludes } from '@std/assert';
import { HttpClient, HttpClientError, type HttpRequestOptions } from '../src/core/http_client.ts';
import { createCapturingMockClient, createErrorMockClient, createNetworkErrorMockClient, createSuccessMockClient } from './utils.ts';

// ===== HTTP Methods Tests =====

Deno.test('HttpClient: GET method', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });
  await client.request('https://example.com/test');

  assertEquals(requestData.options.method, 'GET');
  assertEquals(requestData.url, 'https://example.com/test');
});

Deno.test('HttpClient: POST method', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });
  const body = { name: 'test', value: 123 };

  await client.request('https://example.com/test', {
    method: 'POST',
    body,
  });

  assertEquals(requestData.options.method, 'POST');
  assertEquals(requestData.options.body, body);
});

Deno.test('HttpClient: PUT method', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });
  await client.request('https://example.com/test', { method: 'PUT' });

  assertEquals(requestData.options.method, 'PUT');
});

Deno.test('HttpClient: PATCH method', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });
  await client.request('https://example.com/test', { method: 'PATCH' });

  assertEquals(requestData.options.method, 'PATCH');
});

Deno.test('HttpClient: DELETE method', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });
  await client.request('https://example.com/test', { method: 'DELETE' });

  assertEquals(requestData.options.method, 'DELETE');
});

// ===== Real-world HTTP Methods Tests with httpbin.org =====

Deno.test('HttpClient: real-world GET request', async () => {
  const client = new HttpClient();
  const response = await client.request('https://httpbin.org/get');

  assertEquals(typeof response, 'object');
  assertExists((response as Record<string, unknown>).url);
});

Deno.test('HttpClient: real-world POST request with JSON body', async () => {
  const client = new HttpClient();
  const testData = { name: 'test', value: 123 };

  const response = await client.request('https://httpbin.org/post', {
    method: 'POST',
    body: testData,
  });

  assertEquals(typeof response, 'object');
  assertEquals((response as Record<string, unknown>).json, testData);
});

Deno.test('HttpClient: real-world PUT request', async () => {
  const client = new HttpClient();
  const testData = { updated: true };

  const response = await client.request('https://httpbin.org/put', {
    method: 'PUT',
    body: testData,
  });

  assertEquals(typeof response, 'object');
  assertEquals((response as Record<string, unknown>).json, testData);
});

Deno.test('HttpClient: real-world PATCH request', async () => {
  const client = new HttpClient();
  const testData = { patched: true };

  const response = await client.request('https://httpbin.org/patch', {
    method: 'PATCH',
    body: testData,
  });

  assertEquals(typeof response, 'object');
  assertEquals((response as Record<string, unknown>).json, testData);
});

Deno.test('HttpClient: real-world DELETE request', async () => {
  const client = new HttpClient();

  const response = await client.request('https://httpbin.org/delete', {
    method: 'DELETE',
  });

  assertEquals(typeof response, 'object');
  assertExists((response as Record<string, unknown>).url);
});

// ===== Content-Type Handling Tests =====

Deno.test('HttpClient: JSON content-type handling', async () => {
  const testData = { test: 'data' };
  const client = createSuccessMockClient(testData, 'application/json');

  const result = await client.request('https://example.com');
  assertEquals(result, testData);
});

Deno.test('HttpClient: Text content-type handling', async () => {
  const testData = 'Plain text response';
  const client = createSuccessMockClient(testData, 'text/plain');

  const result = await client.request('https://example.com');
  assertEquals(result, testData);
});

Deno.test('HttpClient: Missing content-type handling', async () => {
  const testData = 'Response with no content-type';
  const client = createSuccessMockClient(testData, '');

  const result = await client.request('https://example.com');
  assertEquals(result, testData);
});

Deno.test('HttpClient: real-world JSON response', async () => {
  const client = new HttpClient();
  const response = await client.request('https://httpbin.org/json');

  assertEquals(typeof response, 'object');
  assertExists((response as Record<string, unknown>).slideshow);
});

Deno.test('HttpClient: real-world text response', async () => {
  const client = new HttpClient();
  const response = await client.request('https://httpbin.org/robots.txt');

  assertEquals(typeof response, 'string');
  assertStringIncludes(response as string, 'User-agent');
});

// ===== Error Handling Tests =====

Deno.test('HttpClient: HTTP 400 Bad Request error', async () => {
  const client = new HttpClient();

  await assertRejects(
    () => client.request('https://httpbin.org/status/400'),
    HttpClientError,
    'HTTP 400',
  );
});

Deno.test('HttpClient: HTTP 404 Not Found error', async () => {
  const client = new HttpClient();

  await assertRejects(
    () => client.request('https://httpbin.org/status/404'),
    HttpClientError,
    'HTTP 404',
  );
});

Deno.test('HttpClient: HTTP 500 Server Error', async () => {
  const client = new HttpClient();

  await assertRejects(
    () => client.request('https://httpbin.org/status/500'),
    HttpClientError,
    'HTTP 500',
  );
});

Deno.test('HttpClient: Error with custom message', async () => {
  const errorMessage = 'Custom error message';
  const client = createErrorMockClient(400, errorMessage);

  await assertRejects(
    () => client.request('https://example.com'),
    HttpClientError,
    errorMessage,
  );
});

Deno.test('HttpClient: Error with status code captured', async () => {
  const client = createErrorMockClient(403, 'Forbidden');

  try {
    await client.request('https://example.com');
  } catch (error) {
    assertExists(error.status);
    assertEquals(error.status, 403);
  }
});

Deno.test('HttpClient: Error response object captured', async () => {
  const client = createErrorMockClient(400, 'Bad Request');

  try {
    await client.request('https://example.com');
  } catch (error) {
    assertExists(error.response);
    assertEquals(error.response.status, 400);
  }
});

Deno.test('HttpClient: Error text extraction fallback', async () => {
  // Create a mock Response that fails when text() is called
  const failingTextResponse = {
    ok: false,
    status: 418,
    statusText: "I'm a teapot",
    text: () => Promise.reject(new Error('Cannot read text')),
    headers: new Headers({ 'content-type': 'text/plain' }),
  } as Response;

  // Create a custom client that uses our failing response
  const client = {
    async request<T = unknown>(
      url: string,
      options: HttpRequestOptions = {},
    ): Promise<T> {
      const { method = 'GET' } = options;

      try {
        // Mock fetch that immediately returns our failing response
        const response = failingTextResponse;

        if (!response.ok) {
          let errorText: string;
          try {
            errorText = await response.text();
          } catch {
            errorText = response.statusText;
          }
          throw new HttpClientError(
            `HTTP ${response.status}: ${errorText}`,
            response.status,
            response,
          );
        }

        return {} as T;
      } catch (err) {
        if (err instanceof HttpClientError) {
          throw err;
        }
        throw new HttpClientError(`Network error: ${err.message}`);
      }
    },
  } as HttpClient;

  await assertRejects(
    () => client.request('https://example.com'),
    HttpClientError,
    "I'm a teapot",
  );
});

Deno.test('HttpClient: Network error handling', async () => {
  const errorMessage = 'Connection refused';
  const client = createNetworkErrorMockClient(errorMessage);

  await assertRejects(
    () => client.request('https://example.com'),
    HttpClientError,
    `Network error: ${errorMessage}`,
  );
});

// ===== AbortSignal Tests =====

Deno.test('HttpClient: AbortSignal functionality', async () => {
  const controller = new AbortController();
  const { client, requestData } = createCapturingMockClient({ success: true });

  // Start request with abort signal
  const requestPromise = client.request('https://example.com', {
    signal: controller.signal,
  });

  // Verify signal is passed to fetch
  assertEquals(requestData.options.signal, controller.signal);

  // Complete the request
  await requestPromise;
});

Deno.test('HttpClient: Aborted request handling', async () => {
  const client = new HttpClient();
  const controller = new AbortController();

  // Abort immediately
  controller.abort();

  await assertRejects(
    () =>
      client.request('https://httpbin.org/delay/3', {
        signal: controller.signal,
      }),
    HttpClientError,
    'Network error',
  );
});

// ===== Request Headers and Body Tests =====

Deno.test('HttpClient: Request with custom headers', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });

  await client.request('https://example.com', {
    headers: {
      'X-Custom-Header': 'test-value',
      'Authorization': 'Bearer token123',
    },
  });

  const headers = requestData.options.headers as Headers;
  assertEquals(headers.get('X-Custom-Header'), 'test-value');
  assertEquals(headers.get('Authorization'), 'Bearer token123');
});

Deno.test('HttpClient: JSON body sets Content-Type header', async () => {
  const { client, requestData } = createCapturingMockClient({ success: true });

  await client.request('https://example.com', {
    method: 'POST',
    body: { data: 'test' },
  });

  const headers = requestData.options.headers as Headers;
  assertEquals(headers.get('Content-Type'), 'application/json');
});
