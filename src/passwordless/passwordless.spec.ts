// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../tests/deno-test-setup.ts";

import { fetchBody, fetchOnce, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import createSession from './fixtures/create-session.json' with { type: "json" };
import { WorkOS } from '../workos.ts';

// Main test suite
describe('Passwordless', () => {
  // Reset fetch mocks before each test
  beforeEach(() => {
    resetMockFetch();
  });

  describe('createSession', () => {
    describe('with valid options', () => {
      it('creates a passwordless session', async () => {
        const email = 'passwordless-session-email@workos.com';
        const redirectURI = 'https://example.com/passwordless/callback';

        fetchOnce(createSession, { status: 201 });

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        const session = await workos.passwordless.createSession({
          type: 'MagicLink',
          email,
          redirectURI,
        });

        assertEquals(session.email, email);
        assertEquals(session.object, 'passwordless_session');

        const body = fetchBody() as Record<string, unknown>;
        assertEquals(body.email, email);
        assertEquals(body.redirect_uri, redirectURI);
        
        const url = fetchURL();
        assertEquals(url?.includes('/passwordless/sessions'), true);
      });
    });
  });

  describe('sendEmail', () => {
    describe('with a valid session id', () => {
      it(`sends a request to send a magic link email`, async () => {
        fetchOnce();
        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        const sessionId = 'session_123';
        await workos.passwordless.sendSession(sessionId);

        const url = fetchURL();
        assertEquals(
          url?.includes(`/passwordless/sessions/${sessionId}/send`),
          true
        );
      });
    });
  });
});
