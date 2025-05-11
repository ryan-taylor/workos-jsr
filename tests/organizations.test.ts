import { Organizations } from '../src/services/organizations.ts';
import type { HttpClient } from '../src/core/http_client.ts';
import { assertEquals } from '@std/assert';

Deno.test('Organizations.list returns orgs (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return {
        data: [
          { id: 'org_1', name: 'Org One' },
          { id: 'org_2', name: 'Org Two' },
        ],
        listMetadata: {},
      };
    }
  }
  const organizations = new Organizations({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await organizations.list();
  assertEquals(result.data.length, 2);
  assertEquals(result.data[0].id, 'org_1');
});

Deno.test('Organizations.get returns org (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return { id: 'org_1', name: 'Org One' };
    }
  }
  const organizations = new Organizations({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await organizations.get({ organizationId: 'org_1' });
  assertEquals(result.id, 'org_1');
  assertEquals(result.name, 'Org One');
});

Deno.test('Organizations.create returns org (mocked)', async () => {
  class MockHttpClient {
    async request(url: string, opts: unknown) {
      return { id: 'org_3', name: 'Org Three' };
    }
  }
  const organizations = new Organizations({
    httpClient: new MockHttpClient() as unknown as HttpClient,
    baseUrl: 'https://api.example.com',
    apiKey: 'sk_test_123',
  });
  const result = await organizations.create({ name: 'Org Three' });
  assertEquals(result.id, 'org_3');
  assertEquals(result.name, 'Org Three');
});
