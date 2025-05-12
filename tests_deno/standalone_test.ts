// Import only from standard Deno library
import { assertEquals, assertExists } from '@std/assert';

// Define mock types and interfaces
interface DirectoryResponse {
  id: string;
  name: string;
  domain: string;
  type: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface ListResponse<T> {
  data: T[];
  list_metadata: {
    before: string | null;
    after: string | null;
  };
}

// Mock API client
class MockApiClient {
  constructor(private apiKey: string) {}

  async makeRequest<T>(path: string): Promise<T> {
    // This is a mock implementation that doesn't actually make network requests
    console.log(`Mock request to: ${path} with API key: ${this.apiKey}`);

    // Return mock data based on the path
    if (path === '/directories') {
      return {
        data: [
          {
            id: 'directory_123',
            name: 'Example Directory',
            domain: 'example.com',
            type: 'okta scim v2.0',
            organization_id: 'org_123',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z',
          },
        ],
        list_metadata: {
          before: null,
          after: null,
        },
      } as unknown as T;
    }

    // Default mock response
    return {} as T;
  }
}

// SDK module for testing
class DirectorySyncModule {
  constructor(private client: MockApiClient) {}

  async listDirectories(): Promise<ListResponse<DirectoryResponse>> {
    return this.client.makeRequest<ListResponse<DirectoryResponse>>('/directories');
  }

  async getDirectory(id: string): Promise<DirectoryResponse> {
    return this.client.makeRequest<DirectoryResponse>(`/directories/${id}`);
  }
}

// Main SDK class
class WorkOSSDK {
  readonly directorySync: DirectorySyncModule;

  constructor(private apiKey: string) {
    const client = new MockApiClient(apiKey);
    this.directorySync = new DirectorySyncModule(client);
  }
}

// Define tests
Deno.test('Standalone test - SDK initialization', () => {
  const sdk = new WorkOSSDK('sk_test_123456789');
  assertExists(sdk);
  assertExists(sdk.directorySync);
});

Deno.test('Standalone test - Directory Sync API', async () => {
  const sdk = new WorkOSSDK('sk_test_123456789');

  // Test listDirectories method
  const directories = await sdk.directorySync.listDirectories();
  assertEquals(directories.data.length, 1);
  assertEquals(directories.data[0].id, 'directory_123');
  assertEquals(directories.data[0].name, 'Example Directory');
});
