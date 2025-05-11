// Import Deno standard testing library
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

import { fetchBody, fetchOnce, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import createSession from './fixtures/create-session.json' with { type: 'json' };
import { WorkOS } from '../workos.ts';

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// Passwordless - createSession
Deno.test('Passwordless - createSession with valid options creates a passwordless session', async () => {
  setup();
  
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

// Passwordless - sendSession
Deno.test('Passwordless - sendSession with a valid session id sends a request', async () => {
  setup();
  
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
