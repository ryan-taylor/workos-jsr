import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { WorkOS } from '../src/workos.ts';
import { HttpClient, HttpClientError } from '../src/core/http_client.ts';

// Sample response data
const mockDirectoryResponse = {
  id: 'directory_123',
  name: 'Example Directory',
  object: 'directory',
  domain: 'example.com',
  type: 'okta scim v2.0',
  state: 'linked',
  external_key: '9asBRBVHz2ASEkgg',
  organization_id: 'org_123456',
  created_at: '2021-06-25T19:07:33.155Z',
  updated_at: '2021-06-25T19:07:33.155Z'
};

const mockListDirectoriesResponse = {
  data: [mockDirectoryResponse],
  list_metadata: {
    before: null,
    after: null
  },
  object: 'list'
};

// Mock client for testing
class MockHttpClient implements HttpClient {
  private requestSpy: {
    url?: string;
    method?: string;
    params?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
  } = {};

  constructor(private readonly mockResponse: any, private readonly statusCode: number = 200) {}

  getRequestDetails() {
    return this.requestSpy;
  }

  async request(url: string, options: any = {}): Promise<any> {
    this.requestSpy.url = url;
    this.requestSpy.method = options.method || 'GET';
    this.requestSpy.params = options.params;
    this.requestSpy.body = options.body;
    this.requestSpy.headers = options.headers;

    if (this.statusCode >= 400) {
      const response = new Response(JSON.stringify(this.mockResponse), {
        status: this.statusCode,
        headers: { 'content-type': 'application/json' }
      });
      throw new HttpClientError(
        `HTTP ${this.statusCode}: Error`,
        this.statusCode,
        response
      );
    }

    return {
      toJSON: async () => this.mockResponse
    };
  }

  async get(url: string, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url: string, body?: any, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'POST', body });
  }

  async put(url: string, body?: any, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  async delete(url: string, options?: any): Promise<any> {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// Helper function to create WorkOS instance with mock client
function createMockWorkOS(mockResponse: any, statusCode = 200): { workos: WorkOS, client: MockHttpClient } {
  const client = new MockHttpClient(mockResponse, statusCode);
  const workos = new WorkOS('sk_test_123456789');
  // Replace the client with our mock client
  (workos as any).client = client;
  return { workos, client };
}

// ===== listDirectories Method Tests =====

Deno.test('DirectorySync: listDirectories with default options', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  const result = await workos.directorySync.listDirectories();

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.method, 'GET');
  assertExists(result.data);
  assertEquals(result.data[0].id, mockDirectoryResponse.id);
  assertEquals(result.data[0].name, mockDirectoryResponse.name);
});

Deno.test('DirectorySync: listDirectories with limit parameter', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({ limit: 10 });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.limit, 10);
});

Deno.test('DirectorySync: listDirectories with before parameter', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({ before: 'directory_abc123' });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.before, 'directory_abc123');
});

Deno.test('DirectorySync: listDirectories with after parameter', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({ after: 'directory_xyz789' });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.after, 'directory_xyz789');
});

Deno.test('DirectorySync: listDirectories with organizationId parameter', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({ organizationId: 'org_123456' });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.organization_id, 'org_123456');
});

Deno.test('DirectorySync: listDirectories with search parameter', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({ search: 'example' });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.search, 'example');
});

Deno.test('DirectorySync: listDirectories with all parameters combined', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockListDirectoriesResponse);

  // Execute
  await workos.directorySync.listDirectories({
    limit: 5,
    before: 'directory_abc123',
    after: 'directory_xyz789',
    organizationId: 'org_123456',
    search: 'example'
  });

  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.params?.limit, 5);
  assertEquals(requestDetails.params?.before, 'directory_abc123');
  assertEquals(requestDetails.params?.after, 'directory_xyz789');
  assertEquals(requestDetails.params?.organization_id, 'org_123456');
  assertEquals(requestDetails.params?.search, 'example');
});

Deno.test('DirectorySync: listDirectories handles pagination', async () => {
  // Setup
  const paginatedResponse = {
    data: [mockDirectoryResponse],
    list_metadata: {
      before: null,
      after: 'directory_next_page'
    },
    object: 'list'
  };
  
  const { workos } = createMockWorkOS(paginatedResponse);
  
  // Execute
  const result = await workos.directorySync.listDirectories();
  
  // Verify
  assertEquals(result.listMetadata?.after, 'directory_next_page');
});

Deno.test('DirectorySync: listDirectories handles error responses', async () => {
  // Setup
  const errorResponse = {
    message: 'Invalid parameter: limit must be between 1 and 100',
    code: 'invalid_parameter'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 400);
  
  // Execute & Verify
  await assertRejects(
    () => workos.directorySync.listDirectories({ limit: 101 }),
    HttpClientError
  );
});

Deno.test('DirectorySync: listDirectories handles server errors', async () => {
  // Setup
  const errorResponse = {
    message: 'Internal Server Error'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 500);
  
  // Execute & Verify
  await assertRejects(
    () => workos.directorySync.listDirectories(),
    HttpClientError
  );
});

// ===== getDirectory Method Tests =====

Deno.test('DirectorySync: getDirectory retrieves successfully', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockDirectoryResponse);
  const directoryId = 'directory_123';
  
  // Execute
  const result = await workos.directorySync.getDirectory(directoryId);
  
  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, `/directories/${directoryId}`);
  assertEquals(requestDetails.method, 'GET');
  assertEquals(result.id, mockDirectoryResponse.id);
  assertEquals(result.name, mockDirectoryResponse.name);
});

Deno.test('DirectorySync: getDirectory correctly passes directory ID', async () => {
  // Setup
  const { workos, client } = createMockWorkOS(mockDirectoryResponse);
  const directoryId = 'directory_abc123';
  
  // Execute
  await workos.directorySync.getDirectory(directoryId);
  
  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, `/directories/${directoryId}`);
});

Deno.test('DirectorySync: getDirectory handles not found error', async () => {
  // Setup
  const errorResponse = {
    message: 'Directory not found: directory_nonexistent',
    code: 'not_found'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 404);
  
  // Execute & Verify
  await assertRejects(
    () => workos.directorySync.getDirectory('directory_nonexistent'),
    HttpClientError
  );
});

Deno.test('DirectorySync: getDirectory handles unauthorized errors', async () => {
  // Setup
  const errorResponse = {
    message: 'Invalid API key provided',
    code: 'unauthorized'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 401);
  
  // Execute & Verify
  await assertRejects(
    () => workos.directorySync.getDirectory('directory_123'),
    HttpClientError
  );
});

Deno.test('DirectorySync: getDirectory handles server errors', async () => {
  // Setup
  const errorResponse = {
    message: 'Internal Server Error'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 500);
  
  // Execute & Verify
  await assertRejects(
    () => workos.directorySync.getDirectory('directory_123'),
    HttpClientError
  );
});

// ===== createDirectory Method Tests =====
// Note: This method doesn't exist in the current implementation but is in the requirements.
// These tests demonstrate how it should be tested when implemented.

Deno.test('DirectorySync: createDirectory with minimal fields (hypothetical)', async () => {
  // Setup
  const mockCreateResponse = {
    ...mockDirectoryResponse,
    id: 'directory_new123',
  };
  const { workos, client } = createMockWorkOS(mockCreateResponse);
  
  const createData = {
    name: 'New Directory',
    domain: 'newexample.com',
    type: 'okta scim v2.0',
    organization_id: 'org_123456',
  };
  
  // For now, mock how this request would look using the WorkOS's post method
  // This would be replaced with directorySync.createDirectory(createData) when implemented
  await workos.post('/directories', createData);
  
  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.body, createData);
});

Deno.test('DirectorySync: createDirectory with all fields (hypothetical)', async () => {
  // Setup
  const mockCreateResponse = {
    ...mockDirectoryResponse,
    id: 'directory_new456',
  };
  const { workos, client } = createMockWorkOS(mockCreateResponse);
  
  const createData = {
    name: 'New Directory with Options',
    domain: 'full-example.com',
    type: 'okta scim v2.0',
    organization_id: 'org_123456',
    state: 'active',
    external_key: 'some-external-key',
  };
  
  // Mock how this request would look
  await workos.post('/directories', createData);
  
  // Verify
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.body, createData);
});

Deno.test('DirectorySync: createDirectory handles validation errors (hypothetical)', async () => {
  // Setup
  const errorResponse = {
    message: 'Missing required field: name',
    code: 'invalid_parameter'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 400);
  
  const createData = {
    // Missing name
    domain: 'example.com',
    type: 'okta scim v2.0',
    organization_id: 'org_123456',
  };
  
  // Execute & Verify
  await assertRejects(
    () => workos.post('/directories', createData),
    HttpClientError
  );
});

Deno.test('DirectorySync: createDirectory handles unauthorized errors (hypothetical)', async () => {
  // Setup
  const errorResponse = {
    message: 'Invalid API key provided',
    code: 'unauthorized'
  };
  
  const { workos } = createMockWorkOS(errorResponse, 401);
  
  const createData = {
    name: 'New Directory',
    domain: 'example.com',
    type: 'okta scim v2.0',
    organization_id: 'org_123456',
  };
  
  // Execute & Verify
  await assertRejects(
    () => workos.post('/directories', createData),
    HttpClientError
  );
});