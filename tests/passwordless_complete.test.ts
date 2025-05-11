import { type AuthenticateOptions, Passwordless, type SendMagicLinkOptions } from '../src/services/passwordless.ts';
import { type HttpClient, HttpClientError } from '../src/core/http_client.ts';
import { assertEquals, assertRejects } from '@std/assert';
import { createCapturingMockClient, createErrorMockClient, createSuccessMockClient } from './utils.ts';

Deno.test('Passwordless.sendMagicLink with required fields', async () => {
  // Create a capturing mock client to verify request details
  const { client, requestData } = createCapturingMockClient(undefined);

  const passwordless = new Passwordless({
    httpClient: client,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await passwordless.sendMagicLink({
    email: 'user@example.com',
    redirectUri: 'https://app.example.com/callback',
  });

  assertEquals(requestData.called, true);
  assertEquals(requestData.url, 'https://api.example.com/passwordless/send');
  assertEquals(requestData.options.method, 'POST');
  const headers = requestData.options.headers as Headers;
  assertEquals(headers.get('Authorization'), 'Bearer sk_test_123');
  assertEquals(headers.get('Content-Type'), 'application/json');

  // Verify that the body contains only the required fields
  const body = requestData.options.body as Record<string, unknown>;
  assertEquals(body.email, 'user@example.com');
  assertEquals(body.redirect_uri, 'https://app.example.com/callback');
  assertEquals('state' in body, false, 'state field should not be present when undefined');
});

Deno.test('Passwordless.sendMagicLink with all fields', async () => {
  const { client, requestData } = createCapturingMockClient(undefined);

  const passwordless = new Passwordless({
    httpClient: client,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await passwordless.sendMagicLink({
    email: 'user@example.com',
    redirectUri: 'https://app.example.com/callback',
    state: 'xyz123',
  });

  assertEquals(requestData.called, true);

  // Verify that all fields are included in the body
  const body = requestData.options.body as Record<string, unknown>;
  assertEquals(body.email, 'user@example.com');
  assertEquals(body.redirect_uri, 'https://app.example.com/callback');
  assertEquals(body.state, 'xyz123');
});

Deno.test('Passwordless.sendMagicLink with undefined state (deletion branch)', async () => {
  const { client, requestData } = createCapturingMockClient(undefined);

  const passwordless = new Passwordless({
    httpClient: client,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  // Explicitly set state to undefined to test the deletion branch
  const options: SendMagicLinkOptions = {
    email: 'user@example.com',
    redirectUri: 'https://app.example.com/callback',
    state: undefined,
  };

  await passwordless.sendMagicLink(options);

  assertEquals(requestData.called, true);

  // Verify that undefined state is not included in the request body
  const body = requestData.options.body as Record<string, unknown>;
  assertEquals('state' in body, false, 'state field should not be present when undefined');
});

Deno.test('Passwordless.sendMagicLink with custom fields', async () => {
  const { client, requestData } = createCapturingMockClient(undefined);

  const passwordless = new Passwordless({
    httpClient: client,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  // Add a custom field
  const options: SendMagicLinkOptions = {
    email: 'user@example.com',
    redirectUri: 'https://app.example.com/callback',
    customField: 'custom-value',
  };

  await passwordless.sendMagicLink(options);

  // Verify the custom field is included in the request
  const body = requestData.options.body as Record<string, unknown>;
  assertEquals(body.customField, 'custom-value');
});

Deno.test('Passwordless.sendMagicLink handles 400 Bad Request error', async () => {
  const errorClient = createErrorMockClient(400, 'Invalid email format');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await assertRejects(
    async () => {
      await passwordless.sendMagicLink({
        email: 'invalid-email',
        redirectUri: 'https://app.example.com/callback',
      });
    },
    HttpClientError,
    'HTTP 400',
  );
});

Deno.test('Passwordless.sendMagicLink handles 401 Unauthorized error', async () => {
  const errorClient = createErrorMockClient(401, 'Invalid API key');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'invalid_key',
  });

  await assertRejects(
    async () => {
      await passwordless.sendMagicLink({
        email: 'user@example.com',
        redirectUri: 'https://app.example.com/callback',
      });
    },
    HttpClientError,
    'HTTP 401',
  );
});

Deno.test('Passwordless.sendMagicLink handles 500 Server error', async () => {
  const errorClient = createErrorMockClient(500, 'Internal server error');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await assertRejects(
    async () => {
      await passwordless.sendMagicLink({
        email: 'user@example.com',
        redirectUri: 'https://app.example.com/callback',
      });
    },
    HttpClientError,
    'HTTP 500',
  );
});

Deno.test('Passwordless.authenticate success with minimal response', async () => {
  const minimalResponse = {
    access_token: 'tok_123456',
    profile: { id: 'user_123' },
  };

  const mockClient = createSuccessMockClient(minimalResponse);

  const passwordless = new Passwordless({
    httpClient: mockClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  const result = await passwordless.authenticate({ code: 'pw_code_123' });

  assertEquals(result.access_token, 'tok_123456');
  assertEquals(result.profile.id, 'user_123');
});

Deno.test('Passwordless.authenticate success with additional fields', async () => {
  const enhancedResponse = {
    access_token: 'tok_123456',
    profile: {
      id: 'user_123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
    },
    organization_id: 'org_123',
    user_id: 'user_123',
    connection_id: 'conn_123',
  };

  const mockClient = createSuccessMockClient(enhancedResponse);

  const passwordless = new Passwordless({
    httpClient: mockClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  const result = await passwordless.authenticate({ code: 'pw_code_123' });

  assertEquals(result.access_token, 'tok_123456');
  assertEquals(result.profile.id, 'user_123');
  assertEquals(result.profile.email, 'user@example.com');
  assertEquals(result.profile.first_name, 'Test');
  assertEquals(result.profile.last_name, 'User');
  assertEquals(result.organization_id, 'org_123');
  assertEquals(result.user_id, 'user_123');
  assertEquals(result.connection_id, 'conn_123');
});

Deno.test('Passwordless.authenticate verifies request payload', async () => {
  const { client, requestData } = createCapturingMockClient({
    access_token: 'tok_123456',
    profile: { id: 'user_123' },
  });

  const passwordless = new Passwordless({
    httpClient: client,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await passwordless.authenticate({ code: 'pw_code_123' });

  assertEquals(requestData.called, true);
  assertEquals(requestData.url, 'https://api.example.com/passwordless/authenticate');
  assertEquals(requestData.options.method, 'POST');
  const headers = requestData.options.headers as Headers;
  assertEquals(headers.get('Authorization'), 'Bearer sk_test_123');
  assertEquals(headers.get('Content-Type'), 'application/json');

  // Verify that the body contains the code
  const body = requestData.options.body as Record<string, unknown>;
  assertEquals(body.code, 'pw_code_123');
});

Deno.test('Passwordless.authenticate handles 400 Bad Request error', async () => {
  const errorClient = createErrorMockClient(400, 'Invalid authentication code');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await assertRejects(
    async () => {
      await passwordless.authenticate({ code: 'invalid_code' });
    },
    HttpClientError,
    'HTTP 400',
  );
});

Deno.test('Passwordless.authenticate handles 401 Unauthorized error', async () => {
  const errorClient = createErrorMockClient(401, 'Invalid API key');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'invalid_key',
  });

  await assertRejects(
    async () => {
      await passwordless.authenticate({ code: 'pw_code_123' });
    },
    HttpClientError,
    'HTTP 401',
  );
});

Deno.test('Passwordless.authenticate handles 404 Not Found error', async () => {
  const errorClient = createErrorMockClient(404, 'Authentication code not found');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await assertRejects(
    async () => {
      await passwordless.authenticate({ code: 'expired_code' });
    },
    HttpClientError,
    'HTTP 404',
  );
});

Deno.test('Passwordless.authenticate handles 500 Server error', async () => {
  const errorClient = createErrorMockClient(500, 'Internal server error');

  const passwordless = new Passwordless({
    httpClient: errorClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });

  await assertRejects(
    async () => {
      await passwordless.authenticate({ code: 'pw_code_123' });
    },
    HttpClientError,
    'HTTP 500',
  );
});
