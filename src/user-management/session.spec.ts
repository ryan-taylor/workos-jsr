// Import standard Deno assertions
import { assertEquals, assertInstanceOf } from 'jsr:@std/assert@1';

import { WorkOS } from '../workos.ts';
import { Session } from './session.ts';
import * as jwtUtils from '../common/crypto/jwt-utils.ts';
import { FreshSessionProvider } from '../common/iron-session/fresh-session-provider.ts';
// Use FreshSessionProvider for sealing session data in Deno
const provider = new FreshSessionProvider();
import { fetchOnce, resetMockFetch, spy } from '../common/utils/test-utils.ts';
import {
  AuthenticateWithSessionCookieFailureReason,
  AuthenticateWithSessionCookieSuccessResponse,
} from './interfaces/authenticate-with-session-cookie.interface.ts';
import { RefreshAndSealSessionDataFailureReason } from './interfaces/refresh-and-seal-session-data.interface.ts';
import type { User } from './interfaces/user.interface.ts';

// Import user fixture directly
const userFixture = {
  'object': 'user',
  'id': 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
  'email': 'test01@example.com',
  'first_name': 'Test 01',
  'last_name': 'User',
  'created_at': '2023-07-18T02:07:19.911Z',
  'updated_at': '2023-07-18T02:07:19.911Z',
  'email_verified': true,
  'profile_picture_url': 'https://example.com/profile_picture.jpg',
  'last_sign_in_at': '2023-07-18T02:07:19.911Z',
  'metadata': { 'key': 'value' },
};

// Setup helper function
function setupTest() {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    clientId: 'client_123',
  });
  resetMockFetch();
  return workos;
}

// Teardown helper function
function teardownJwtSpy(originalJwtVerify: typeof jwtUtils.jwtVerify) {
  Object.defineProperty(jwtUtils, 'jwtVerify', {
    value: originalJwtVerify,
    configurable: true,
  });
}

// Setup JWT mock helper
function setupJwtVerifySpy(mockImplementation: () => Promise<unknown>) {
  const originalJwtVerify = jwtUtils.jwtVerify;
  const jwtVerifySpy = spy(mockImplementation);

  Object.defineProperty(jwtUtils, 'jwtVerify', {
    value: jwtVerifySpy,
    configurable: true,
  });

  return { originalJwtVerify, jwtVerifySpy };
}

// Constructor tests
Deno.test('Session - constructor throws an error if cookiePassword is not provided', () => {
  const workos = setupTest();
  try {
    workos.userManagement.loadSealedSession({
      sessionData: 'sessionData',
      cookiePassword: '',
    });
    throw new Error('Expected to throw but did not');
  } catch (error) {
    assertInstanceOf(error, Error);
    assertEquals((error as Error).message, 'cookiePassword is required');
  }
});

Deno.test('Session - constructor creates a new Session instance', () => {
  const workos = setupTest();
  const session = workos.userManagement.loadSealedSession({
    sessionData: 'sessionData',
    cookiePassword: 'cookiePassword',
  });

  // Check if session is an instance of Session
  assertInstanceOf(session, Session);
});

// Authenticate tests
Deno.test('Session - authenticate returns a failed response if no sessionData is provided', async () => {
  const workos = setupTest();

  const session = workos.userManagement.loadSealedSession({
    sessionData: '',
    cookiePassword: 'cookiePassword',
  });
  const response = await session.authenticate();

  assertEquals(response, {
    authenticated: false,
    reason: AuthenticateWithSessionCookieFailureReason.NO_SESSION_COOKIE_PROVIDED,
  });
});

Deno.test('Session - authenticate returns a failed response if no accessToken is found in the sessionData', async () => {
  const workos = setupTest();

  const session = workos.userManagement.loadSealedSession({
    sessionData: 'sessionData',
    cookiePassword: 'cookiePassword',
  });

  const response = await session.authenticate();

  assertEquals(response, {
    authenticated: false,
    reason: AuthenticateWithSessionCookieFailureReason.INVALID_SESSION_COOKIE,
  });
});

Deno.test('Session - authenticate returns a failed response if the accessToken is not a valid JWT', async () => {
  const workos = setupTest();

  // Setup JWT verify spy that throws an error
  const { originalJwtVerify } = setupJwtVerifySpy(() => {
    throw new Error('Invalid JWT');
  });

  try {
    const cookiePassword = 'alongcookiesecretmadefortestingsessions';

    // Create a shortened token to avoid line length issues
    const sampleToken = 'ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIy';

    const sessionData = await provider.sealData(
      {
        accessToken: sampleToken,
        refreshToken: 'def456',
        user: {
          object: 'user',
          id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
          email: 'test@example.com',
          emailVerified: true,
          profilePictureUrl: null,
          firstName: null,
          lastName: null,
          lastSignInAt: null,
          createdAt: '2023-07-18T02:07:19.911Z',
          updatedAt: '2023-07-18T02:07:19.911Z',
          externalId: null,
          metadata: {},
        } as User,
      },
      { password: cookiePassword },
    );

    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });
    const response = await session.authenticate();

    assertEquals(response, {
      authenticated: false,
      reason: AuthenticateWithSessionCookieFailureReason.INVALID_JWT,
    });
  } finally {
    // Restore original function
    teardownJwtSpy(originalJwtVerify);
  }
});

Deno.test('Session - authenticate returns a successful response if the sessionData is valid', async () => {
  const workos = setupTest();

  // Setup JWT verify spy that returns a successful result
  const { originalJwtVerify } = setupJwtVerifySpy(async () => {
    return {} as any;
  });

  try {
    const cookiePassword = 'alongcookiesecretmadefortestingsessions';

    // Split the token into multiple lines to avoid hitting the line length limit
    const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoZW50aWNhdGVkIjp0cnVlLCJpbXBlcnNvbmF0b3IiOn' +
      'siZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJlYXNvbiI6InRlc3QifSwic2lkIjoic2Vzc2lvbl8xMjMiLCJvcm' +
      'dfaWQiOiJvcmdfMTIzIiwicm9sZSI6Im1lbWJlciIsInBlcm1pc3Npb25zIjpbInBvc3RzOmNyZWF0ZSIsInBvc3RzOm' +
      'RlbGV0ZSJdLCJlbnRpdGxlbWVudHMiOlsiYXVkaXQtbG9ncyJdLCJ1c2VyIjp7Im9iamVjdCI6InVzZXIiLCJpZCI6In' +
      'VzZXJfMDFINUpRRFY3UjdBVEVZWkRFRzBXNVBSWVMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifX0.A8mDST4wtq' +
      '_0vId6ALg7k2Ukr7FXrszZtdJ_6dfXeAc';

    const sessionData = await provider.sealData(
      {
        accessToken,
        refreshToken: 'def456',
        impersonator: {
          email: 'admin@example.com',
          reason: 'test',
        },
        user: {
          object: 'user',
          id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
          email: 'test@example.com',
          emailVerified: true,
          profilePictureUrl: null,
          firstName: null,
          lastName: null,
          lastSignInAt: null,
          createdAt: '2023-07-18T02:07:19.911Z',
          updatedAt: '2023-07-18T02:07:19.911Z',
          externalId: null,
          metadata: {},
        } as User,
      },
      { password: cookiePassword },
    );

    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });

    const response = await session.authenticate();

    assertEquals(response.authenticated, true);

    // Type guard to ensure we're working with a success response
    if (response.authenticated) {
      const successResponse = response as AuthenticateWithSessionCookieSuccessResponse;
      assertEquals(successResponse.impersonator, {
        email: 'admin@example.com',
        reason: 'test',
      });
      assertEquals(successResponse.sessionId, 'session_123');
      assertEquals(successResponse.organizationId, 'org_123');
      assertEquals(successResponse.role, 'member');
      assertEquals(successResponse.permissions, ['posts:create', 'posts:delete']);
      assertEquals(successResponse.entitlements, ['audit-logs']);
      assertEquals(successResponse.user.id, 'user_01H5JQDV7R7ATEYZDEG0W5PRYS');
      assertEquals(successResponse.user.email, 'test@example.com');
      assertEquals(successResponse.user.object, 'user');
      assertEquals(successResponse.accessToken, accessToken);
    }
  } finally {
    // Restore original function
    teardownJwtSpy(originalJwtVerify);
  }
});

// Refresh tests
Deno.test('Session - refresh returns a failed response if invalid session data is provided', async () => {
  const workos = setupTest();
  fetchOnce({ user: userFixture });

  const session = workos.userManagement.loadSealedSession({
    sessionData: '',
    cookiePassword: 'cookiePassword',
  });

  const response = await session.refresh();

  assertEquals(response, {
    authenticated: false,
    reason: RefreshAndSealSessionDataFailureReason.INVALID_SESSION_COOKIE,
  });
});

Deno.test('Session - refresh when session data is valid returns a successful response with sealed and unsealed session', async () => {
  const workos = setupTest();

  // Split the token into multiple lines to avoid hitting the line length limit
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2' +
    'UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsC' +
    'iAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const refreshToken = 'def456';

  fetchOnce({
    user: userFixture,
    accessToken,
    refreshToken,
  });

  const cookiePassword = 'alongcookiesecretmadefortestingsessions';

  const userWithProperType: User = {
    object: 'user',
    id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
    email: 'test01@example.com',
    emailVerified: true,
    profilePictureUrl: 'https://example.com/profile_picture.jpg',
    firstName: 'Test 01',
    lastName: 'User',
    lastSignInAt: '2023-07-18T02:07:19.911Z',
    createdAt: '2023-07-18T02:07:19.911Z',
    updatedAt: '2023-07-18T02:07:19.911Z',
    externalId: null,
    metadata: { key: 'value' },
  };

  const sessionData = await provider.sealData(
    {
      accessToken,
      refreshToken,
      impersonator: {
        email: 'admin@example.com',
        reason: 'test',
      },
      user: userWithProperType,
    },
    { password: cookiePassword },
  );

  const session = workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword,
  });

  const response = await session.refresh();

  assertEquals(response.authenticated, true);

  // Type guard to ensure we're working with a success response
  if (response.authenticated) {
    assertEquals(response.impersonator, {
      email: 'admin@example.com',
      reason: 'test',
    });
    assertEquals(response.organizationId, 'org_123');
    assertEquals(typeof response.sealedSession, 'string');

    if (response.session) {
      assertEquals(response.session.user.email, 'test01@example.com');
    }

    assertEquals(response.permissions, ['posts:create', 'posts:delete']);
    assertEquals(response.role, 'member');
    assertEquals(response.sessionId, 'session_123');
    assertEquals(response.user.email, 'test01@example.com');
    assertEquals(response.user.id, 'user_01H5JQDV7R7ATEYZDEG0W5PRYS');
    assertEquals(response.user.object, 'user');
  }
});

Deno.test('Session - refresh overwrites the cookie password if a new one is provided', async () => {
  const workos = setupTest();

  // Split the token into multiple lines to avoid hitting the line length limit
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2' +
    'UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsC' +
    'iAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const refreshToken = 'def456';

  fetchOnce({
    user: userFixture,
    accessToken,
    refreshToken,
  });

  // Setup JWT verify spy
  const { originalJwtVerify } = setupJwtVerifySpy(async () => {
    return {} as any;
  });

  try {
    const cookiePassword = 'alongcookiesecretmadefortestingsessions';

    const userWithProperType: User = {
      object: 'user',
      id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
      email: 'test01@example.com',
      emailVerified: true,
      profilePictureUrl: null,
      firstName: null,
      lastName: null,
      lastSignInAt: null,
      createdAt: '2023-07-18T02:07:19.911Z',
      updatedAt: '2023-07-18T02:07:19.911Z',
      externalId: null,
      metadata: {},
    };

    const sessionData = await provider.sealData(
      {
        accessToken,
        refreshToken,
        user: userWithProperType,
      },
      { password: cookiePassword },
    );

    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });

    const newCookiePassword = 'anevenlongercookiesecretmadefortestingsessions';

    const response = await session.refresh({
      cookiePassword: newCookiePassword,
    });

    assertEquals(response.authenticated, true);

    const resp = await session.authenticate();

    assertEquals(resp.authenticated, true);
  } finally {
    // Restore original function
    teardownJwtSpy(originalJwtVerify);
  }
});

// getLogoutUrl tests
Deno.test('Session - getLogoutUrl returns a logout URL for the user', async () => {
  const workos = setupTest();

  // Setup JWT verify spy
  const { originalJwtVerify } = setupJwtVerifySpy(async () => {
    return {} as any;
  });

  try {
    const cookiePassword = 'alongcookiesecretmadefortestingsessions';

    const userWithProperType: User = {
      object: 'user',
      id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
      email: 'test01@example.com',
      emailVerified: true,
      profilePictureUrl: null,
      firstName: null,
      lastName: null,
      lastSignInAt: null,
      createdAt: '2023-07-18T02:07:19.911Z',
      updatedAt: '2023-07-18T02:07:19.911Z',
      externalId: null,
      metadata: {},
    };

    // Split the token into multiple lines to avoid hitting the line length limit
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2' +
      'UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsC' +
      'iAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.' +
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const sessionData = await provider.sealData(
      {
        accessToken,
        refreshToken: 'def456',
        user: userWithProperType,
      },
      { password: cookiePassword },
    );

    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });

    const url = await session.getLogoutUrl();

    assertEquals(url, 'https://api.workos.com/user_management/sessions/logout?session_id=session_123');
  } finally {
    // Restore original function
    teardownJwtSpy(originalJwtVerify);
  }
});

Deno.test('Session - getLogoutUrl returns an error if the session is invalid', async () => {
  const workos = setupTest();

  const session = workos.userManagement.loadSealedSession({
    sessionData: '',
    cookiePassword: 'cookiePassword',
  });

  try {
    await session.getLogoutUrl();
    throw new Error('Expected to throw but did not');
  } catch (error) {
    assertInstanceOf(error, Error);
    assertEquals((error as Error).message, 'Failed to extract session ID for logout URL: no_session_cookie_provided');
  }
});

Deno.test('Session - getLogoutUrl with returnTo URL returns a logout URL with return_to parameter', async () => {
  const workos = setupTest();

  // Setup JWT verify spy
  const { originalJwtVerify } = setupJwtVerifySpy(async () => {
    return {} as any;
  });

  try {
    const cookiePassword = 'alongcookiesecretmadefortestingsessions';

    const userWithProperType: User = {
      object: 'user',
      id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
      email: 'test01@example.com',
      emailVerified: true,
      profilePictureUrl: null,
      firstName: null,
      lastName: null,
      lastSignInAt: null,
      createdAt: '2023-07-18T02:07:19.911Z',
      updatedAt: '2023-07-18T02:07:19.911Z',
      externalId: null,
      metadata: {},
    };

    // Split the token into multiple lines to avoid hitting the line length limit
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2' +
      'UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsC' +
      'iAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.' +
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const sessionData = await provider.sealData(
      {
        accessToken,
        refreshToken: 'def456',
        user: userWithProperType,
      },
      { password: cookiePassword },
    );

    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    });

    const url = await session.getLogoutUrl({
      returnTo: 'https://example.com/signed-out',
    });

    const expectedUrl = 'https://api.workos.com/user_management/sessions/logout?session_id=session_123&' +
      'return_to=https%3A%2F%2Fexample.com%2Fsigned-out';

    assertEquals(url, expectedUrl);
  } finally {
    // Restore original function
    teardownJwtSpy(originalJwtVerify);
  }
});
