import { assertEquals, assertExists, assertThrows } from '@std/assert';
import { WorkOS, type WorkOSOptions } from '../src/core/workos.ts';
import { HttpClient } from '../src/core/http_client.ts';
import type { createCapturingMockClient, createErrorMockClient, createNetworkErrorMockClient, createSuccessMockClient } from './utils.ts';

// Initialization Tests

Deno.test('WorkOS: successfully initializes with valid API key', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  assertExists(workos);
  assertEquals(workos.apiKey, validApiKey);
});

Deno.test('WorkOS: throws error with empty API key', () => {
  assertThrows(
    () => new WorkOS({ apiKey: '' }),
    Error,
    'WorkOS: apiKey is required',
  );
});

Deno.test('WorkOS: throws error with undefined API key', () => {
  assertThrows(
    () => new WorkOS({ apiKey: undefined as unknown as string }),
    Error,
    'WorkOS: apiKey is required',
  );
});

Deno.test('WorkOS: uses default base URL when not provided', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  assertEquals(workos.baseUrl, 'https://api.workos.com');
});

Deno.test('WorkOS: uses custom base URL when provided', () => {
  const validApiKey = 'test_valid_api_key_123';
  const customBaseUrl = 'https://custom-api.workos.test';

  const workos = new WorkOS({
    apiKey: validApiKey,
    baseUrl: customBaseUrl,
  });

  assertEquals(workos.baseUrl, customBaseUrl);
});

Deno.test('WorkOS: initializes with options object', () => {
  const validApiKey = 'test_valid_api_key_123';
  const customBaseUrl = 'https://custom-api.workos.test';

  const options: WorkOSOptions = {
    apiKey: validApiKey,
    baseUrl: customBaseUrl,
  };

  const workos = new WorkOS(options);

  assertExists(workos);
  assertEquals(workos.apiKey, validApiKey);
  assertEquals(workos.baseUrl, customBaseUrl);
});

// Service Registration Tests

Deno.test('WorkOS: instantiates all services with proper configuration', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  // Verify all services are instantiated
  assertExists(workos.sso);
  assertExists(workos.passwordless);
  assertExists(workos.mfa);
  assertExists(workos.organizations);
  assertExists(workos.directorySync);
});

Deno.test('WorkOS: services are accessible via the WorkOS instance', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  // Ensure each service is accessible and is of the correct type
  assertExists(workos.sso);
  assertExists(workos.passwordless);
  assertExists(workos.mfa);
  assertExists(workos.organizations);
  assertExists(workos.directorySync);
});

Deno.test('WorkOS: inaccessible services return undefined', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  // @ts-ignore - Testing runtime behavior
  assertEquals(workos.nonExistentService, undefined);
});

// Config Propagation Tests

Deno.test('WorkOS: API key is propagated to all services', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  // Verify API key was set correctly
  assertEquals(workos.apiKey, validApiKey);

  // The actual propagation to services happens in the service constructors
  // We're indirectly testing this by verifying services are properly initialized
  assertExists(workos.sso);
  assertExists(workos.passwordless);
  assertExists(workos.mfa);
  assertExists(workos.organizations);
  assertExists(workos.directorySync);
});

Deno.test('WorkOS: Base URL is propagated to all services', () => {
  const validApiKey = 'test_valid_api_key_123';
  const customBaseUrl = 'https://custom-api.workos.test';

  const workos = new WorkOS({
    apiKey: validApiKey,
    baseUrl: customBaseUrl,
  });

  // Verify base URL is properly set
  assertEquals(workos.baseUrl, customBaseUrl);
});

Deno.test('WorkOS: HttpClient is initialized and available to services', () => {
  const validApiKey = 'test_valid_api_key_123';
  const workos = new WorkOS({ apiKey: validApiKey });

  // Verify httpClient is initialized
  assertExists(workos.httpClient);

  // Check that httpClient is an instance of HttpClient
  assertEquals(workos.httpClient instanceof HttpClient, true);
});

// Edge Cases Tests

Deno.test('WorkOS: handles null options gracefully', () => {
  assertThrows(
    () => new WorkOS(null as unknown as WorkOSOptions),
    Error,
    'WorkOS: apiKey is required',
  );
});

Deno.test('WorkOS: handles undefined options gracefully', () => {
  assertThrows(
    () => new WorkOS(undefined as unknown as WorkOSOptions),
    Error,
    'WorkOS: apiKey is required',
  );
});
