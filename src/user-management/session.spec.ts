// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../tests/deno-test-setup.ts";

import { WorkOS } from '../workos.ts';
import { Session } from './session.ts';
import * as jose from 'jose';
import { sealData } from 'iron-session';
import { fetchOnce, resetMockFetch, spy } from '../common/utils/test-utils.ts';

// Import user fixture directly
const userFixture = {
  "object": "user",
  "id": "user_01H5JQDV7R7ATEYZDEG0W5PRYS",
  "email": "test01@example.com",
  "first_name": "Test 01",
  "last_name": "User",
  "created_at": "2023-07-18T02:07:19.911Z",
  "updated_at": "2023-07-18T02:07:19.911Z",
  "email_verified": true,
  "profile_picture_url": "https://example.com/profile_picture.jpg",
  "last_sign_in_at": "2023-07-18T02:07:19.911Z",
  "metadata": { "key": "value" }
};

describe('Session', () => {
  let workos: WorkOS;

  // Setup before all tests
  workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    clientId: 'client_123',
  });

  beforeEach(() => {
    resetMockFetch();
  });

  describe('constructor', () => {
    it('throws an error if cookiePassword is not provided', () => {
      try {
        workos.userManagement.loadSealedSession({
          sessionData: 'sessionData',
          cookiePassword: '',
        });
        throw new Error('Expected to throw but did not');
      } catch (error) {
        assertEquals(error instanceof Error, true);
        assertEquals((error as Error).message, 'cookiePassword is required');
      }
    });

    it('creates a new Session instance', () => {
      const session = workos.userManagement.loadSealedSession({
        sessionData: 'sessionData',
        cookiePassword: 'cookiePassword',
      });

      // Check if session is an instance of Session
      assertEquals(session instanceof Session, true);
    });
  });

  describe('authenticate', () => {
    it('returns a failed response if no sessionData is provided', async () => {
      const session = workos.userManagement.loadSealedSession({
        sessionData: '',
        cookiePassword: 'cookiePassword',
      });
      const response = await session.authenticate();

      assertEquals(response, {
        authenticated: false,
        reason: 'no_session_cookie_provided',
      });
    });

    it('returns a failed response if no accessToken is found in the sessionData', async () => {
      const session = workos.userManagement.loadSealedSession({
        sessionData: 'sessionData',
        cookiePassword: 'cookiePassword',
      });

      const response = await session.authenticate();

      assertEquals(response, {
        authenticated: false,
        reason: 'invalid_session_cookie',
      });
    });

    it('returns a failed response if the accessToken is not a valid JWT', async () => {
      // Create a spy for jose.jwtVerify that throws an error
      const originalJwtVerify = jose.jwtVerify;
      const jwtVerifySpy = spy(() => {
        throw new Error('Invalid JWT');
      });
      
      // Use Object.defineProperty to temporarily replace the method
      Object.defineProperty(jose, 'jwtVerify', {
        value: jwtVerifySpy,
        configurable: true,
      });

      try {
        const cookiePassword = 'alongcookiesecretmadefortestingsessions';

        const sessionData = await sealData(
          {
            accessToken:
              'ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsCiAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9',
            refreshToken: 'def456',
            user: {
              object: 'user',
              id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
              email: 'test@example.com',
            },
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
          reason: 'invalid_jwt',
        });
      } finally {
        // Restore original function
        Object.defineProperty(jose, 'jwtVerify', {
          value: originalJwtVerify,
          configurable: true,
        });
      }
    });

    it('returns a successful response if the sessionData is valid', async () => {
      // Create a spy for jose.jwtVerify that returns a successful result
      const originalJwtVerify = jose.jwtVerify;
      const jwtVerifySpy = spy(async () => {
        return {} as jose.JWTVerifyResult & jose.ResolvedKey;
      });
      
      // Use Object.defineProperty to temporarily replace the method
      Object.defineProperty(jose, 'jwtVerify', {
        value: jwtVerifySpy,
        configurable: true,
      });

      try {
        const cookiePassword = 'alongcookiesecretmadefortestingsessions';

        const accessToken =
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoZW50aWNhdGVkIjp0cnVlLCJpbXBlcnNvbmF0b3IiOnsiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJlYXNvbiI6InRlc3QifSwic2lkIjoic2Vzc2lvbl8xMjMiLCJvcmdfaWQiOiJvcmdfMTIzIiwicm9sZSI6Im1lbWJlciIsInBlcm1pc3Npb25zIjpbInBvc3RzOmNyZWF0ZSIsInBvc3RzOmRlbGV0ZSJdLCJlbnRpdGxlbWVudHMiOlsiYXVkaXQtbG9ncyJdLCJ1c2VyIjp7Im9iamVjdCI6InVzZXIiLCJpZCI6InVzZXJfMDFINUpRRFY3UjdBVEVZWkRFRzBXNVBSWVMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifX0.A8mDST4wtq_0vId6ALg7k2Ukr7FXrszZtdJ_6dfXeAc';

        const sessionData = await sealData(
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
            },
          },
          { password: cookiePassword },
        );

        const session = workos.userManagement.loadSealedSession({
          sessionData,
          cookiePassword,
        });

        const response = await session.authenticate();
        
        assertEquals(response.authenticated, true);
        assertEquals(response.impersonator, {
          email: 'admin@example.com',
          reason: 'test',
        });
        assertEquals(response.sessionId, 'session_123');
        assertEquals(response.organizationId, 'org_123');
        assertEquals(response.role, 'member');
        assertEquals(response.permissions, ['posts:create', 'posts:delete']);
        assertEquals(response.entitlements, ['audit-logs']);
        assertEquals(response.user, {
          object: 'user',
          id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
          email: 'test@example.com',
        });
        assertEquals(response.accessToken, accessToken);
      } finally {
        // Restore original function
        Object.defineProperty(jose, 'jwtVerify', {
          value: originalJwtVerify,
          configurable: true,
        });
      }
    });
  });

  describe('refresh', () => {
    it('returns a failed response if invalid session data is provided', async () => {
      fetchOnce({ user: userFixture });

      const session = workos.userManagement.loadSealedSession({
        sessionData: '',
        cookiePassword: 'cookiePassword',
      });

      const response = await session.refresh();

      assertEquals(response, {
        authenticated: false,
        reason: 'invalid_session_cookie',
      });
    });

    describe('when the session data is valid', () => {
      it('returns a successful response with a sealed and unsealed session', async () => {
        const accessToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsCiAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const refreshToken = 'def456';

        fetchOnce({
          user: userFixture,
          accessToken,
          refreshToken,
        });

        const cookiePassword = 'alongcookiesecretmadefortestingsessions';

        const sessionData = await sealData(
          {
            accessToken,
            refreshToken,
            impersonator: {
              email: 'admin@example.com',
              reason: 'test',
            },
            user: {
              object: 'user',
              id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
              email: 'test01@example.com',
            },
          },
          { password: cookiePassword },
        );

        const session = workos.userManagement.loadSealedSession({
          sessionData,
          cookiePassword,
        });

        const response = await session.refresh();

        assertEquals(response.authenticated, true);
        assertEquals(response.impersonator, {
          email: 'admin@example.com',
          reason: 'test',
        });
        assertEquals(response.organizationId, 'org_123');
        assertEquals(typeof response.sealedSession, 'string');
        assertEquals(response.session.user.email, 'test01@example.com');
        assertEquals(response.permissions, ['posts:create', 'posts:delete']);
        assertEquals(response.role, 'member');
        assertEquals(response.sessionId, 'session_123');
        assertEquals(response.user.email, 'test01@example.com');
        assertEquals(response.user.id, 'user_01H5JQDV7R7ATEYZDEG0W5PRYS');
        assertEquals(response.user.object, 'user');
      });

      it('overwrites the cookie password if a new one is provided', async () => {
        const accessToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsCiAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const refreshToken = 'def456';

        fetchOnce({
          user: userFixture,
          accessToken,
          refreshToken,
        });

        // Create a spy for jose.jwtVerify that returns a successful result
        const originalJwtVerify = jose.jwtVerify;
        const jwtVerifySpy = spy(async () => {
          return {} as jose.JWTVerifyResult & jose.ResolvedKey;
        });
        
        // Use Object.defineProperty to temporarily replace the method
        Object.defineProperty(jose, 'jwtVerify', {
          value: jwtVerifySpy,
          configurable: true,
        });

        try {
          const cookiePassword = 'alongcookiesecretmadefortestingsessions';

          const sessionData = await sealData(
            {
              accessToken,
              refreshToken,
              user: {
                object: 'user',
                id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
                email: 'test01@example.com',
              },
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
          Object.defineProperty(jose, 'jwtVerify', {
            value: originalJwtVerify,
            configurable: true,
          });
        }
      });
    });
  });

  describe('getLogoutUrl', () => {
    it('returns a logout URL for the user', async () => {
      // Create a spy for jose.jwtVerify that returns a successful result
      const originalJwtVerify = jose.jwtVerify;
      const jwtVerifySpy = spy(async () => {
        return {} as jose.JWTVerifyResult & jose.ResolvedKey;
      });
      
      // Use Object.defineProperty to temporarily replace the method
      Object.defineProperty(jose, 'jwtVerify', {
        value: jwtVerifySpy,
        configurable: true,
      });

      try {
        const cookiePassword = 'alongcookiesecretmadefortestingsessions';

        const sessionData = await sealData(
          {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsCiAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            refreshToken: 'def456',
            user: {
              object: 'user',
              id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
              email: 'test01@example.com',
            },
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
        Object.defineProperty(jose, 'jwtVerify', {
          value: originalJwtVerify,
          configurable: true,
        });
      }
    });

    it('returns an error if the session is invalid', async () => {
      const session = workos.userManagement.loadSealedSession({
        sessionData: '',
        cookiePassword: 'cookiePassword',
      });

      try {
        await session.getLogoutUrl();
        throw new Error('Expected to throw but did not');
      } catch (error) {
        assertEquals(error instanceof Error, true);
        assertEquals((error as Error).message, 'Failed to extract session ID for logout URL: no_session_cookie_provided');
      }
    });

    describe('when a returnTo URL is provided', () => {
      it('returns a logout URL for the user', async () => {
        // Create a spy for jose.jwtVerify that returns a successful result
        const originalJwtVerify = jose.jwtVerify;
        const jwtVerifySpy = spy(async () => {
          return {} as jose.JWTVerifyResult & jose.ResolvedKey;
        });
        
        // Use Object.defineProperty to temporarily replace the method
        Object.defineProperty(jose, 'jwtVerify', {
          value: jwtVerifySpy,
          configurable: true,
        });

        try {
          const cookiePassword = 'alongcookiesecretmadefortestingsessions';

          const sessionData = await sealData(
            {
              accessToken:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNTE2MjM5MDIyLAogICJzaWQiOiAic2Vzc2lvbl8xMjMiLAogICJvcmdfaWQiOiAib3JnXzEyMyIsCiAgInJvbGUiOiAibWVtYmVyIiwKICAicGVybWlzc2lvbnMiOiBbInBvc3RzOmNyZWF0ZSIsICJwb3N0czpkZWxldGUiXQp9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
              refreshToken: 'def456',
              user: {
                object: 'user',
                id: 'user_01H5JQDV7R7ATEYZDEG0W5PRYS',
                email: 'test01@example.com',
              },
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

          assertEquals(url, 'https://api.workos.com/user_management/sessions/logout?session_id=session_123&return_to=https%3A%2F%2Fexample.com%2Fsigned-out');
        } finally {
          // Restore original function
          Object.defineProperty(jose, 'jwtVerify', {
            value: originalJwtVerify,
            configurable: true,
          });
        }
      });
    });
  });
});
