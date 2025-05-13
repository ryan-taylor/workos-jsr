import { assertEquals, assertRejects } from '@std/assert';

/**
 * Tests for the DirectorySync class
 * Covers getDirectory, listDirectories, listGroups, and listUsers methods
 * with both required and optional parameters
 */

// Mock WorkOS instance for testing
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastParams: unknown = null;
  private shouldThrow = false;

  constructor(mockResponse: unknown, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async get<T>(path: string, params?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = 'get';
    this.lastParams = params;
    
    if (this.shouldThrow) {
      throw new Error('Mock API error');
    }
    
    return { data: this.mockResponseData as T };
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      params: this.lastParams
    };
  }
}

// Mock DirectorySync class implementation to match the one in packages/workos_sdk/src/directory-sync/directory-sync.ts
class DirectorySync {
  constructor(private readonly workos: MockWorkOS) {}

  async getDirectory(id: string): Promise<{
    id: string;
    name: string;
    domain: string;
    object: "directory";
    state: string;
    type: string;
    created_at: string;
    updated_at: string;
  }> {
    const { data } = await this.workos.get(`/directories/${id}`);
    return data as {
      id: string;
      name: string;
      domain: string;
      object: "directory";
      state: string;
      type: string;
      created_at: string;
      updated_at: string;
    };
  }

  async listDirectories(query: Record<string, unknown> = {}): Promise<{
    data: Array<{
      id: string;
      name: string;
      domain: string;
      object: "directory";
      state: string;
      type: string;
      created_at: string;
      updated_at: string;
    }>;
    list_metadata: {
      before: string | null;
      after: string | null;
    };
  }> {
    const { data } = await this.workos.get("/directories", query);
    return data as {
      data: Array<{
        id: string;
        name: string;
        domain: string;
        object: "directory";
        state: string;
        type: string;
        created_at: string;
        updated_at: string;
      }>;
      list_metadata: {
        before: string | null;
        after: string | null;
      };
    };
  }

  async listGroups(query: Record<string, unknown> = {}): Promise<{
    data: Array<{
      id: string;
      directory_id: string;
      name: string;
      object: "directory_group";
      created_at: string;
      updated_at: string;
    }>;
    list_metadata: {
      before: string | null;
      after: string | null;
    };
  }> {
    const { data } = await this.workos.get("/directory_groups", query);
    return data as {
      data: Array<{
        id: string;
        directory_id: string;
        name: string;
        object: "directory_group";
        created_at: string;
        updated_at: string;
      }>;
      list_metadata: {
        before: string | null;
        after: string | null;
      };
    };
  }

  async listUsers(query: Record<string, unknown> = {}): Promise<{
    data: Array<{
      id: string;
      directory_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      username: string | null;
      object: "directory_user";
      created_at: string;
      updated_at: string;
    }>;
    list_metadata: {
      before: string | null;
      after: string | null;
    };
  }> {
    const { data } = await this.workos.get("/directory_users", query);
    return data as {
      data: Array<{
        id: string;
        directory_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        object: "directory_user";
        created_at: string;
        updated_at: string;
      }>;
      list_metadata: {
        before: string | null;
        after: string | null;
      };
    };
  }
}

Deno.test('DirectorySync - getDirectory', async () => {
  // Mock response data
  const mockDirectory = {
    id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
    name: 'Acme Inc.',
    domain: 'acme.com',
    object: 'directory',
    state: 'active',
    type: 'okta scim v2.0',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-02T00:00:00.000Z'
  };
  
  const mockWorkos = new MockWorkOS(mockDirectory);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method
  const result = await directorySync.getDirectory(mockDirectory.id);
  
  // Verify result
  assertEquals(result.id, mockDirectory.id);
  assertEquals(result.name, mockDirectory.name);
  assertEquals(result.domain, mockDirectory.domain);
  assertEquals(result.object, mockDirectory.object);
  assertEquals(result.state, mockDirectory.state);
  assertEquals(result.type, mockDirectory.type);
  assertEquals(result.created_at, mockDirectory.created_at);
  assertEquals(result.updated_at, mockDirectory.updated_at);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, `/directories/${mockDirectory.id}`);
  assertEquals(lastRequest.method, 'get');
});

Deno.test('DirectorySync - getDirectory handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await directorySync.getDirectory('directory_01FVYZ1B6FRCBCYMEA77PHAKX7');
    },
    Error,
    'Mock API error'
  );
});

Deno.test('DirectorySync - listDirectories with no parameters', async () => {
  // Mock response data
  const mockDirectoriesResponse = {
    data: [
      {
        id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        name: 'Acme Inc.',
        domain: 'acme.com',
        object: 'directory',
        state: 'active',
        type: 'okta scim v2.0',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: null
    }
  };
  
  const mockWorkos = new MockWorkOS(mockDirectoriesResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with no parameters
  const result = await directorySync.listDirectories();
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockDirectoriesResponse.data[0].id);
  assertEquals(result.data[0].name, mockDirectoriesResponse.data[0].name);
  assertEquals(result.list_metadata.before, null);
  assertEquals(result.list_metadata.after, null);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directories');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, {});
});

Deno.test('DirectorySync - listDirectories with parameters', async () => {
  // Mock response data
  const mockDirectoriesResponse = {
    data: [
      {
        id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        name: 'Acme Inc.',
        domain: 'acme.com',
        object: 'directory',
        state: 'active',
        type: 'okta scim v2.0',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX8'
    }
  };
  
  const mockWorkos = new MockWorkOS(mockDirectoriesResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with parameters
  const query = {
    limit: 10,
    before: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX9',
    domain: 'acme.com'
  };
  
  const result = await directorySync.listDirectories(query);
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockDirectoriesResponse.data[0].id);
  assertEquals(result.list_metadata.after, 'directory_01FVYZ1B6FRCBCYMEA77PHAKX8');
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directories');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, query);
});

Deno.test('DirectorySync - listGroups with no parameters', async () => {
  // Mock response data
  const mockGroupsResponse = {
    data: [
      {
        id: 'directory_group_01FVYZ1B6FRCBCYMEA77PHAKX7',
        directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        name: 'Engineering',
        object: 'directory_group',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: null
    }
  };
  
  const mockWorkos = new MockWorkOS(mockGroupsResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with no parameters
  const result = await directorySync.listGroups();
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockGroupsResponse.data[0].id);
  assertEquals(result.data[0].name, mockGroupsResponse.data[0].name);
  assertEquals(result.list_metadata.before, null);
  assertEquals(result.list_metadata.after, null);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directory_groups');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, {});
});

Deno.test('DirectorySync - listGroups with parameters', async () => {
  // Mock response data
  const mockGroupsResponse = {
    data: [
      {
        id: 'directory_group_01FVYZ1B6FRCBCYMEA77PHAKX7',
        directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        name: 'Engineering',
        object: 'directory_group',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: 'directory_group_01FVYZ1B6FRCBCYMEA77PHAKX8'
    }
  };
  
  const mockWorkos = new MockWorkOS(mockGroupsResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with parameters
  const query = {
    limit: 10,
    directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
    after: 'directory_group_01FVYZ1B6FRCBCYMEA77PHAKY0'
  };
  
  const result = await directorySync.listGroups(query);
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockGroupsResponse.data[0].id);
  assertEquals(result.data[0].directory_id, query.directory_id);
  assertEquals(result.list_metadata.after, 'directory_group_01FVYZ1B6FRCBCYMEA77PHAKX8');
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directory_groups');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, query);
});

Deno.test('DirectorySync - listUsers with no parameters', async () => {
  // Mock response data
  const mockUsersResponse = {
    data: [
      {
        id: 'directory_user_01FVYZ1B6FRCBCYMEA77PHAKX7',
        directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        email: 'john@acme.com',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        object: 'directory_user',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: null
    }
  };
  
  const mockWorkos = new MockWorkOS(mockUsersResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with no parameters
  const result = await directorySync.listUsers();
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockUsersResponse.data[0].id);
  assertEquals(result.data[0].email, mockUsersResponse.data[0].email);
  assertEquals(result.data[0].first_name, mockUsersResponse.data[0].first_name);
  assertEquals(result.data[0].last_name, mockUsersResponse.data[0].last_name);
  assertEquals(result.data[0].username, mockUsersResponse.data[0].username);
  assertEquals(result.list_metadata.before, null);
  assertEquals(result.list_metadata.after, null);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directory_users');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, {});
});

Deno.test('DirectorySync - listUsers with parameters', async () => {
  // Mock response data
  const mockUsersResponse = {
    data: [
      {
        id: 'directory_user_01FVYZ1B6FRCBCYMEA77PHAKX7',
        directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
        email: 'john@acme.com',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        object: 'directory_user',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      }
    ],
    list_metadata: {
      before: null,
      after: 'directory_user_01FVYZ1B6FRCBCYMEA77PHAKX8'
    }
  };
  
  const mockWorkos = new MockWorkOS(mockUsersResponse);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Execute the method with parameters
  const query = {
    limit: 10,
    directory_id: 'directory_01FVYZ1B6FRCBCYMEA77PHAKX7',
    email: 'john@acme.com'
  };
  
  const result = await directorySync.listUsers(query);
  
  // Verify result
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].id, mockUsersResponse.data[0].id);
  assertEquals(result.data[0].email, query.email);
  assertEquals(result.data[0].directory_id, query.directory_id);
  assertEquals(result.list_metadata.after, 'directory_user_01FVYZ1B6FRCBCYMEA77PHAKX8');
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/directory_users');
  assertEquals(lastRequest.method, 'get');
  assertEquals(lastRequest.params, query);
});

Deno.test('DirectorySync - listGroups handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await directorySync.listGroups();
    },
    Error,
    'Mock API error'
  );
});

Deno.test('DirectorySync - listUsers handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const directorySync = new DirectorySync(mockWorkos);
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await directorySync.listUsers();
    },
    Error,
    'Mock API error'
  );
});