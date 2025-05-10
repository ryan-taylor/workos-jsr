import { Passwordless } from '../src/services/passwordless.ts';
import { HttpClient } from '../src/core/http_client.ts';
import { assertEquals } from '@std/assert';

Deno.test('Passwordless.sendMagicLink calls POST (mocked)', async () => {
  let called = false;
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      called = true;
      return undefined;
    }
  }
  const passwordless = new Passwordless({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  await passwordless.sendMagicLink({
    email: 'user@example.com',
    redirectUri: 'https://app.example.com/callback',
    state: 'xyz',
  });
  assertEquals(called, true);
});

Deno.test('Passwordless.authenticate returns profile (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return {
        access_token: 'tok_pw_123',
        profile: { id: 'user_pw_1' },
      };
    }
  }
  const passwordless = new Passwordless({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await passwordless.authenticate({ code: 'pw_code_abc' });
  assertEquals(result.access_token, 'tok_pw_123');
  assertEquals(result.profile.id, 'user_pw_1');
}); 