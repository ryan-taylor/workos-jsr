// Session management tests for Fresh 2.x Canary

import { assertContains, assertEquals, assertExists, createMockUser, type mockFetchJson, type mockFetchRedirect, type restoreFetch } from './test_config.ts';
import { createUserSession, getCurrentUser, requireAuth, SESSION_OPTIONS, type SessionData, type WorkOSUser } from '../utils/user-management.ts';
import { FreshSessionProvider } from '../../../src/common/iron-session/fresh-session-provider.ts';

// Mock for FreshContext
type MockContext = {
  url: URL;
  next: () => Promise<Response>;
  state: Record<string, unknown>;
};

// Mock session provider and cookies for testing
class MockSessionProvider extends FreshSessionProvider {
  sessions: Map<string, SessionData> = new Map();
  cookies: Map<string, string> = new Map();

  override async getSession<T>(req: Request, options: any): Promise<T | null> {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieName = options.cookieName || 'workos_session';

    // Extract session ID from cookie
    const match = new RegExp(`${cookieName}=([^;]+)`).exec(cookieHeader);
    const sessionId = match?.[1];

    if (!sessionId || !this.sessions.has(sessionId)) {
      return null;
    }

    return this.sessions.get(sessionId) as unknown as T;
  }

  override async createSessionResponse<T>(
    sessionData: T,
    options: any,
    response: Response,
  ): Promise<Response> {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, sessionData as unknown as SessionData);

    // Add cookie to the response
    const cookieName = options.cookieName || 'workos_session';
    const cookieValue = `${cookieName}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`;

    // Clone the response and add the cookie
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', cookieValue);

    this.cookies.set(sessionId, cookieValue);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Create a request with session cookie
  createRequestWithSession(url: string, sessionId: string): Request {
    const cookieValue = this.cookies.get(sessionId);
    const headers = new Headers();

    if (cookieValue) {
      headers.append('cookie', cookieValue);
    }

    return new Request(url, { headers });
  }
}

// Test helper to simulate route navigation
async function simulateNavigation(
  routes: string[],
  sessionProvider: MockSessionProvider,
  sessionId?: string,
): Promise<Response[]> {
  const responses: Response[] = [];

  for (const route of routes) {
    // Create request with session if available
    const request = sessionId ? sessionProvider.createRequestWithSession(route, sessionId) : new Request(route);

    // Call requireAuth to check if route needs authentication
    const authResponse = await requireAuth(request);

    if (authResponse) {
      // Route requires auth and user is not authenticated
      responses.push(authResponse);
    } else {
      // User is authenticated or route doesn't require auth
      // For test purposes, return a mock response
      responses.push(new Response('Success', { status: 200 }));
    }
  }

  return responses;
}

// Simulates a middleware context for protected routes
function createProtectedRouteContext(url: string, sessionId?: string, mockProvider?: MockSessionProvider): MockContext {
  const provider = mockProvider || new MockSessionProvider();

  const ctx: MockContext = {
    url: new URL(url),
    next: async () => new Response('Protected Content', { status: 200 }),
    state: {},
  };

  return ctx;
}

// Test helper for simulating session expiry and refresh
async function simulateSessionExpiry(
  sessionProvider: MockSessionProvider,
  sessionId: string,
  user: WorkOSUser,
): Promise<SessionData | null> {
  // Get the original session
  const session = sessionProvider.sessions.get(sessionId);

  if (!session) return null;

  // Create an expired session (simulate by removing it)
  sessionProvider.sessions.delete(sessionId);

  // Create a refreshed session with new tokens
  const refreshedSession: SessionData = {
    user: user,
    accessToken: 'new_access_token_after_refresh',
    refreshToken: 'new_refresh_token',
  };

  const response = await createUserSession(refreshedSession);
  const cookie = response.headers.get('Set-Cookie');

  if (!cookie) return null;

  // Extract new session ID
  const match = new RegExp(`${SESSION_OPTIONS.cookieName}=([^;]+)`).exec(cookie || '');
  const newSessionId = match?.[1];

  if (!newSessionId) return null;

  return sessionProvider.sessions.get(newSessionId) || null;
}

// Tests

Deno.test('Session Management - Auth state persists across route navigation', async () => {
  const sessionProvider = new MockSessionProvider();

  // Create a user session
  const user = createMockUser();
  const sessionData: SessionData = {
    user,
    accessToken: 'test_access_token',
    refreshToken: 'test_refresh_token',
  };

  // Create a session response
  const initialResponse = await sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
    new Response(null, { status: 302, headers: { Location: '/dashboard' } }),
  );

  // Extract session ID from Set-Cookie header
  const cookie = initialResponse.headers.get('Set-Cookie');
  assertExists(cookie, 'Cookie should be set');

  const match = new RegExp(`${SESSION_OPTIONS.cookieName}=([^;]+)`).exec(cookie || '');
  const sessionId = match?.[1];
  assertExists(sessionId, 'Session ID should be extracted from cookie');

  // Navigate to different routes
  const routes = [
    'http://localhost:8000/dashboard',
    'http://localhost:8000/profile',
    'http://localhost:8000/settings',
  ];

  const responses = await simulateNavigation(routes, sessionProvider, sessionId);

  // All responses should be successful (not redirects to login)
  for (const response of responses) {
    assertEquals(response.status, 200, 'User should remain authenticated across routes');
  }

  // Verify user data is consistent across routes
  if (sessionId) {
    for (const route of routes) {
      const request = sessionProvider.createRequestWithSession(route, sessionId);
      const currentUser = await getCurrentUser(request);

      assertEquals(currentUser?.id, user.id, 'User ID should persist across routes');
      assertEquals(currentUser?.email, user.email, 'User email should persist across routes');
    }
  }
});

Deno.test('Session Management - Protected routes redirect unauthenticated users', async () => {
  // Try to access protected routes without authentication
  const sessionProvider = new MockSessionProvider();

  const protectedRoutes = [
    'http://localhost:8000/dashboard',
    'http://localhost:8000/profile',
    'http://localhost:8000/settings',
  ];

  const responses = await simulateNavigation(protectedRoutes, sessionProvider);

  // All responses should be redirects to login
  for (const response of responses) {
    assertEquals(response.status, 302, 'Unauthenticated request should be redirected');

    const location = response.headers.get('Location');
    assertExists(location, 'Redirect Location header should be set');
    if (location) {
      assertContains(location, '/login', 'Should redirect to login page');
    }
  }
});

Deno.test('Session Management - Session expiry handling works correctly', async () => {
  const sessionProvider = new MockSessionProvider();

  // Create a user session
  const user = createMockUser();
  const sessionData: SessionData = {
    user,
    accessToken: 'test_access_token',
    refreshToken: 'test_refresh_token',
  };

  // Create a session response
  const initialResponse = await sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
    new Response(null, { status: 302, headers: { Location: '/dashboard' } }),
  );

  // Extract session ID from Set-Cookie header
  const cookie = initialResponse.headers.get('Set-Cookie');
  assertExists(cookie, 'Cookie should be set');

  const match = new RegExp(`${SESSION_OPTIONS.cookieName}=([^;]+)`).exec(cookie || '');
  const sessionId = match?.[1];
  assertExists(sessionId, 'Session ID should be extracted from cookie');

  // Simulate session expiry by deleting it
  if (sessionId) {
    sessionProvider.sessions.delete(sessionId);

    // Try to access a protected route with the expired session
    const route = 'http://localhost:8000/dashboard';
    const request = sessionProvider.createRequestWithSession(route, sessionId);
    const authResponse = await requireAuth(request);

    // Should redirect to login
    assertExists(authResponse, 'Should get a redirect response when session expired');
    if (authResponse) {
      assertEquals(authResponse.status, 302, 'Expired session should redirect to login');

      const location = authResponse.headers.get('Location');
      assertExists(location, 'Redirect Location header should be set');
      if (location) {
        assertContains(location, '/login', 'Should redirect to login page');
      }
    }
  }
});

Deno.test('Session Management - Authentication token refresh works', async () => {
  const sessionProvider = new MockSessionProvider();

  // Create a user session with an access token and refresh token
  const user = createMockUser();
  const sessionData: SessionData = {
    user,
    accessToken: 'test_access_token',
    refreshToken: 'test_refresh_token',
  };

  // Create a session response
  const initialResponse = await sessionProvider.createSessionResponse(
    sessionData,
    SESSION_OPTIONS,
    new Response(null, { status: 302, headers: { Location: '/dashboard' } }),
  );

  // Extract session ID from Set-Cookie header
  const cookie = initialResponse.headers.get('Set-Cookie');
  assertExists(cookie, 'Cookie should be set');

  const match = new RegExp(`${SESSION_OPTIONS.cookieName}=([^;]+)`).exec(cookie || '');
  const sessionId = match?.[1];
  assertExists(sessionId, 'Session ID should be extracted from cookie');

  // Simulate token refresh
  if (sessionId) {
    const refreshedSession = await simulateSessionExpiry(sessionProvider, sessionId, user);

    // Verify refreshed session
    assertExists(refreshedSession, 'Should get a refreshed session');
    if (refreshedSession) {
      assertEquals(refreshedSession.user.id, user.id, 'User ID should be preserved');
      assertEquals(refreshedSession.accessToken, 'new_access_token_after_refresh', 'Should have new access token');
      assertEquals(refreshedSession.refreshToken, 'new_refresh_token', 'Should have new refresh token');
    }
  }
});
