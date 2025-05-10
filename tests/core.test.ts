import { assertEquals, assertExists, assertInstanceOf, assertThrows } from '@std/assert';
import { WorkOS } from '../src/core/workos.ts';
import { WorkOSError, HttpClientError } from '../src/core/errors.ts';
import { HttpClient } from '../src/core/http_client.ts';
import { MockHttpClient, createMockWorkOS } from './utils.ts';

// ===== Errors Module Tests =====

Deno.test('WorkOSError: instantiation and properties', () => {
  const errorMessage = 'Test error message';
  const error = new WorkOSError(errorMessage);
  
  assertInstanceOf(error, Error);
  assertInstanceOf(error, WorkOSError);
  assertEquals(error.message, errorMessage);
  assertEquals(error.name, 'WorkOSError');
});

Deno.test('WorkOSError: extending Error class', () => {
  const error = new WorkOSError('Test error');
  
  // Should be instance of both Error and WorkOSError
  assertEquals(error instanceof Error, true);
  assertEquals(error instanceof WorkOSError, true);
  
  // Should be capturable in try/catch
  let caught = false;
  try {
    throw new WorkOSError('Test error');
  } catch (e) {
    caught = true;
    assertInstanceOf(e, WorkOSError);
  }
  assertEquals(caught, true);
});

Deno.test('HttpClientError: instantiation with just message', () => {
  const errorMessage = 'Network failure';
  const error = new HttpClientError(errorMessage);
  
  assertInstanceOf(error, Error);
  assertInstanceOf(error, HttpClientError);
  assertEquals(error.message, errorMessage);
  assertEquals(error.name, 'HttpClientError');
  assertEquals(error.status, undefined);
  assertEquals(error.response, undefined);
});

Deno.test('HttpClientError: instantiation with status code', () => {
  const errorMessage = 'Not found';
  const statusCode = 404;
  const error = new HttpClientError(errorMessage, statusCode);
  
  assertEquals(error.message, errorMessage);
  assertEquals(error.status, statusCode);
  assertEquals(error.response, undefined);
});

Deno.test('HttpClientError: instantiation with status and response', () => {
  const errorMessage = 'Bad request';
  const statusCode = 400;
  const mockResponse = new Response('{"error": "Invalid input"}', {
    status: statusCode,
    headers: { 'content-type': 'application/json' }
  });
  
  const error = new HttpClientError(errorMessage, statusCode, mockResponse);
  
  assertEquals(error.message, errorMessage);
  assertEquals(error.status, statusCode);
  assertExists(error.response);
  assertEquals(error.response?.status, statusCode);
});

// ===== HttpClient Tests (Using MockHttpClient) =====

Deno.test('MockHttpClient: request tracking behavior', async () => {
  const mockResponse = { success: true, data: { id: '123' } };
  const client = new MockHttpClient(mockResponse);
  
  // Make a request
  const response = await client.request('https://api.example.com/test', {
    method: 'POST',
    body: { name: 'Test' },
    headers: { 'X-Custom-Header': 'value' }
  });
  
  // Check response
  assertEquals(await response.toJSON(), mockResponse);
  
  // Check captured request details
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, 'https://api.example.com/test');
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.body, { name: 'Test' });
  
  // Check headers with safety check
  const headers = requestDetails.headers;
  assertExists(headers);
  if (headers) {
    assertEquals(headers['X-Custom-Header'], 'value');
  }
});

Deno.test('MockHttpClient: error response behavior', async () => {
  const errorResponse = { error: 'Invalid request', code: 'invalid_input' };
  const client = new MockHttpClient(errorResponse, 400);
  
  // Make a request that should fail
  let error: HttpClientError | undefined;
  try {
    await client.request('https://api.example.com/test');
  } catch (e) {
    error = e as HttpClientError;
  }
  
  // Verify error was thrown
  assertExists(error);
  assertInstanceOf(error, HttpClientError);
  
  // Now that we've verified error exists, we can safely use it
  if (error) {
    assertEquals(error.status, 400);
    
    // Check response details
    assertExists(error.response);
    if (error.response) {
      const responseText = await error.response.text();
      assertEquals(JSON.parse(responseText), errorResponse);
    }
  }
});

Deno.test('MockHttpClient: convenience methods', async () => {
  const mockResponse = { success: true };
  const client = new MockHttpClient(mockResponse);
  
  // Test GET method
  await client.get('https://api.example.com/resource');
  assertEquals(client.getRequestDetails().method, 'GET');
  
  // Test POST method
  const postBody = { name: 'Test' };
  await client.post('https://api.example.com/resource', postBody);
  assertEquals(client.getRequestDetails().method, 'POST');
  assertEquals(client.getRequestDetails().body, postBody);
  
  // Test PUT method
  const putBody = { id: '123', name: 'Updated' };
  await client.put('https://api.example.com/resource/123', putBody);
  assertEquals(client.getRequestDetails().method, 'PUT');
  assertEquals(client.getRequestDetails().body, putBody);
  
  // Test DELETE method
  await client.delete('https://api.example.com/resource/123');
  assertEquals(client.getRequestDetails().method, 'DELETE');
});

// ===== WorkOS Class Tests (Using createMockWorkOS) =====

Deno.test('WorkOS: using createMockWorkOS helper', () => {
  const mockResponse = { success: true };
  const { workos, client } = createMockWorkOS(mockResponse);
  
  // Verify WorkOS instance
  assertInstanceOf(workos, WorkOS);
  assertEquals((workos as any).apiKey, 'sk_test_123456789');
  
  // Verify client was replaced with our mock
  assertEquals((workos as any).client, client);
  assertInstanceOf(client, MockHttpClient);
});

Deno.test('WorkOS: making API calls with mocked client', async () => {
  const mockResponse = { 
    object: 'connection',
    id: 'conn_01FYVCA47XJKDQ3QBDM82Y59WM',
    organization_id: 'org_01FYVCA4QW33VMNZTYVF5HSYPS',
    connection_type: 'OktaSAML',
    state: 'active',
    domains: [],
    name: 'Acme Inc',
    created_at: '2022-03-23T16:32:46.153Z',
    updated_at: '2022-03-23T16:32:46.153Z'
  };
  
  const { workos, client } = createMockWorkOS(mockResponse);
  
  // Test using the SSO service with our mock
  const connection = await workos.sso.getConnection({
    connection: 'conn_01FYVCA47XJKDQ3QBDM82Y59WM'
  });
  
  // Verify connection data was returned as expected
  assertEquals(connection.id, 'conn_01FYVCA47XJKDQ3QBDM82Y59WM');
  assertEquals(connection.organization_id, 'org_01FYVCA4QW33VMNZTYVF5HSYPS');
  assertEquals(connection.connection_type, 'OktaSAML');
  
  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'GET');
  assertEquals(requestDetails.url?.includes('/connections/'), true);
});

Deno.test('WorkOS: handling API errors with mocked client', async () => {
  const errorResponse = { 
    error_type: 'authentication_error',
    message: 'Invalid API key provided'
  };
  
  // Create with an error status code (401)
  const { workos, client } = createMockWorkOS(errorResponse, 401);
  
  // Make an API request that should fail
  let error: HttpClientError | undefined;
  try {
    await workos.sso.getConnection({
      connection: 'conn_invalid'
    });
  } catch (e) {
    error = e as HttpClientError;
  }
  
  // Verify error was thrown
  assertExists(error);
  assertInstanceOf(error, HttpClientError);
  
  // Now we can safely check the status since we've verified error exists
  if (error) {
    assertEquals(error.status, 401);
  }
  
  // Check that the request was attempted
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'GET');
});

Deno.test('WorkOS: proper service initialization with mock client', () => {
  const { workos } = createMockWorkOS({});
  
  // Verify all services are correctly initialized
  assertExists(workos.sso);
  assertExists(workos.passwordless);
  assertExists(workos.mfa);
  assertExists(workos.organizations);
  assertExists(workos.directorySync);
  
  // Verify each service has access to the client
  // This ensures configuration is properly passed to services
  assertEquals((workos.sso as any).client instanceof MockHttpClient, true);
  assertEquals((workos.passwordless as any).client instanceof MockHttpClient, true);
  assertEquals((workos.mfa as any).client instanceof MockHttpClient, true);
  assertEquals((workos.organizations as any).client instanceof MockHttpClient, true);
  assertEquals((workos.directorySync as any).client instanceof MockHttpClient, true);
});