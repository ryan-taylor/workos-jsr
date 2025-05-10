import { SSO } from '../src/services/sso.ts';
import { HttpClient } from '../src/core/http_client.ts';
import { assertEquals } from '@std/assert';

Deno.test('SSO.getAuthorizationUrl builds correct URL', () => {
  const sso = new SSO({
    httpClient: new HttpClient(),
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const url = sso.getAuthorizationUrl({
    clientId: 'client_abc',
    redirectUri: 'https://app.example.com/callback',
    state: 'xyz',
    provider: 'GoogleOAuth',
  });
  const parsed = new URL(url);
  assertEquals(parsed.origin, 'https://api.example.com');
  assertEquals(parsed.pathname, '/sso/authorize');
  assertEquals(parsed.searchParams.get('clientId'), 'client_abc');
  assertEquals(parsed.searchParams.get('redirectUri'), 'https://app.example.com/callback');
  assertEquals(parsed.searchParams.get('state'), 'xyz');
  assertEquals(parsed.searchParams.get('provider'), 'GoogleOAuth');
});

Deno.test('SSO.getProfileAndToken makes POST and returns response (mocked)', async () => {
  // Mock HttpClient
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return {
        access_token: 'tok_123',
        profile: { id: 'user_1' },
      };
    }
  }
  const sso = new SSO({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await sso.getProfileAndToken({
    clientId: 'client_abc',
    clientSecret: 'secret_abc',
    code: 'code_abc',
  });
  assertEquals(result.access_token, 'tok_123');
  assertEquals(result.profile.id, 'user_1');
}); 