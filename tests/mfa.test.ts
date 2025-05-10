import { MFA } from '../src/services/mfa.ts';
import { HttpClient } from '../src/core/http_client.ts';
import { assertEquals } from '@std/assert';

Deno.test('MFA.enroll returns factor (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return { id: 'factor_1', type: 'totp' };
    }
  }
  const mfa = new MFA({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await mfa.enroll({ userId: 'user_1', type: 'totp' });
  assertEquals(result.id, 'factor_1');
  assertEquals(result.type, 'totp');
});

Deno.test('MFA.challenge returns challenge (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return { id: 'challenge_1', factor_id: 'factor_1' };
    }
  }
  const mfa = new MFA({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await mfa.challenge({ factorId: 'factor_1' });
  assertEquals(result.id, 'challenge_1');
  assertEquals(result.factor_id, 'factor_1');
});

Deno.test('MFA.verify returns valid (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return { valid: true };
    }
  }
  const mfa = new MFA({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await mfa.verify({ challengeId: 'challenge_1', code: '123456' });
  assertEquals(result.valid, true);
}); 