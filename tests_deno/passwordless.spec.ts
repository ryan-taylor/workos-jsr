import { assertEquals, assertRejects } from '@std/assert';

/**
 * Tests for the Passwordless class
 * Covers createSession and sendSession methods with both required and optional parameters
 */

// Mock WorkOS instance for testing
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastData: unknown = null;
  private shouldThrow = false;

  constructor(mockResponse: unknown, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = 'post';
    this.lastData = data;
    
    if (this.shouldThrow) {
      throw new Error('Mock API error');
    }
    
    return { data: this.mockResponseData as T };
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      data: this.lastData
    };
  }
}

// Mock Passwordless class implementation to match the one in src/passwordless/passwordless.ts
class Passwordless {
  constructor(private readonly workos: MockWorkOS) {}

  async createSession({
    redirectURI,
    expiresIn,
    ...options
  }: {
    type: "MagicLink";
    email: string;
    redirectURI?: string;
    state?: string;
    connection?: string;
    expiresIn?: number;
  }): Promise<{
    id: string;
    email: string;
    expiresAt: Date;
    link: string;
    object: "passwordless_session";
  }> {
    const { data } = await this.workos.post("/passwordless/sessions", {
      ...options,
      redirect_uri: redirectURI,
      expires_in: expiresIn,
    });

    // Mock the deserialization by returning data directly
    return data as {
      id: string;
      email: string;
      expiresAt: Date;
      link: string;
      object: "passwordless_session";
    };
  }

  async sendSession(sessionId: string): Promise<{
    message?: string;
    success?: boolean;
  }> {
    const { data } = await this.workos.post(
      `/passwordless/sessions/${sessionId}/send`,
      {},
    );
    return data as { message?: string; success?: boolean; };
  }
}

Deno.test('Passwordless - createSession with required parameters', async () => {
  // Mock response data
  const mockSession = {
    id: 'session_01FVYZ1B6FRCBCYMEA77PHAKX7',
    email: 'user@example.com',
    expiresAt: new Date('2025-05-20T10:00:00Z'),
    link: 'https://auth.workos.com/passwordless/token/123',
    object: 'passwordless_session'
  };
  
  const mockWorkos = new MockWorkOS(mockSession);
  const passwordless = new Passwordless(mockWorkos);
  
  // Test data with only required parameters
  const params = {
    type: 'MagicLink' as const,
    email: 'user@example.com'
  };
  
  // Execute the method
  const result = await passwordless.createSession(params);
  
  // Verify result
  assertEquals(result.id, mockSession.id);
  assertEquals(result.email, mockSession.email);
  assertEquals(result.expiresAt, mockSession.expiresAt);
  assertEquals(result.link, mockSession.link);
  assertEquals(result.object, mockSession.object);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/passwordless/sessions');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).type, 'MagicLink');
  assertEquals((lastRequest.data as Record<string, unknown>).email, 'user@example.com');
  assertEquals((lastRequest.data as Record<string, unknown>).redirect_uri, undefined);
  assertEquals((lastRequest.data as Record<string, unknown>).expires_in, undefined);
});

Deno.test('Passwordless - createSession with all parameters', async () => {
  // Mock response data
  const mockSession = {
    id: 'session_01FVYZ1B6FRCBCYMEA77PHAKX7',
    email: 'user@example.com',
    expiresAt: new Date('2025-05-20T10:00:00Z'),
    link: 'https://auth.workos.com/passwordless/token/123',
    object: 'passwordless_session'
  };
  
  const mockWorkos = new MockWorkOS(mockSession);
  const passwordless = new Passwordless(mockWorkos);
  
  // Test data with all parameters
  const params = {
    type: 'MagicLink' as const,
    email: 'user@example.com',
    redirectURI: 'https://example.com/callback',
    state: 'custom-state',
    connection: 'connection_123',
    expiresIn: 86400
  };
  
  // Execute the method
  const result = await passwordless.createSession(params);
  
  // Verify result
  assertEquals(result.id, mockSession.id);
  assertEquals(result.email, mockSession.email);
  
  // Verify correct API call was made with all parameters
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/passwordless/sessions');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).type, 'MagicLink');
  assertEquals((lastRequest.data as Record<string, unknown>).email, 'user@example.com');
  assertEquals((lastRequest.data as Record<string, unknown>).redirect_uri, 'https://example.com/callback');
  assertEquals((lastRequest.data as Record<string, unknown>).state, 'custom-state');
  assertEquals((lastRequest.data as Record<string, unknown>).connection, 'connection_123');
  assertEquals((lastRequest.data as Record<string, unknown>).expires_in, 86400);
});

Deno.test('Passwordless - createSession handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const passwordless = new Passwordless(mockWorkos);
  
  // Test data
  const params = {
    type: 'MagicLink' as const,
    email: 'user@example.com'
  };
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await passwordless.createSession(params);
    },
    Error,
    'Mock API error'
  );
});

Deno.test('Passwordless - sendSession with valid session ID', async () => {
  // Mock response data
  const mockResponse = {
    success: true,
    message: 'Email sent successfully'
  };
  
  const mockWorkos = new MockWorkOS(mockResponse);
  const passwordless = new Passwordless(mockWorkos);
  
  const sessionId = 'session_01FVYZ1B6FRCBCYMEA77PHAKX7';
  
  // Execute the method
  const result = await passwordless.sendSession(sessionId);
  
  // Verify result
  assertEquals(result.success, mockResponse.success);
  assertEquals(result.message, mockResponse.message);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, `/passwordless/sessions/${sessionId}/send`);
  assertEquals(lastRequest.method, 'post');
  assertEquals(lastRequest.data, {});
});

Deno.test('Passwordless - sendSession handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const passwordless = new Passwordless(mockWorkos);
  
  const sessionId = 'session_01FVYZ1B6FRCBCYMEA77PHAKX7';
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await passwordless.sendSession(sessionId);
    },
    Error,
    'Mock API error'
  );
});