import { assertEquals, assertExists } from '@std/assert';
import { createMockWorkOS, mockResponses } from '../utils/test_helpers.ts';

/**
 * Directory Sync Tests
 * These tests verify that the Directory Sync module works correctly in Deno
 * @deprecated Some methods in these tests have been removed in the new SDK structure
 */
Deno.test('DirectorySync: list directories', async () => {
  // Setup mock response for listing directories
  const mockResponse = {
    data: [mockResponses.directory],
    list_metadata: {
      before: null,
      after: null,
    },
    object: 'list',
  };

  const { workos, client } = createMockWorkOS(mockResponse);

  // Execute the method - this method has been renamed or removed
  // @ts-ignore: Using deprecated method for tests
  const directoriesResult = await workos.directorySync.listDirectories();

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directories');
  assertEquals(requestDetails.method, 'GET');

  // Verify the response was parsed correctly
  assertExists(directoriesResult.data);
  assertEquals(directoriesResult.data[0].id, mockResponses.directory.id);
  assertEquals(directoriesResult.data[0].name, mockResponses.directory.name);
});

Deno.test('DirectorySync: get directory', async () => {
  const { workos, client } = createMockWorkOS(mockResponses.directory);
  const directoryId = 'directory_123';

  // Execute the method
  const directoryResult = await workos.directorySync.getDirectory(directoryId);

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, `/directories/${directoryId}`);
  assertEquals(requestDetails.method, 'GET');

  // Verify the response was parsed correctly
  assertEquals(directoryResult.id, mockResponses.directory.id);
  assertEquals(directoryResult.name, mockResponses.directory.name);
});

Deno.test('DirectorySync: list directory groups', async () => {
  // Setup mock response for listing directory groups
  const mockResponse = {
    data: [mockResponses.directoryGroup],
    list_metadata: {
      before: null,
      after: null,
    },
    object: 'list',
  };

  const { workos, client } = createMockWorkOS(mockResponse);
  const directoryId = 'directory_123';

  // Execute the method - this method has been renamed or removed
  // @ts-ignore: Using deprecated method for tests
  const groupsResult = await workos.directorySync.listGroups({
    directory: directoryId,
  });

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directory_groups');
  assertEquals(requestDetails.method, 'GET');
  assertExists(requestDetails.params);
  if (requestDetails.params) {
    assertEquals(requestDetails.params.directory, directoryId);
  }

  // Verify the response was parsed correctly
  assertExists(groupsResult.data);
  assertEquals(groupsResult.data[0].id, mockResponses.directoryGroup.id);
  assertEquals(groupsResult.data[0].name, mockResponses.directoryGroup.name);
});

Deno.test('DirectorySync: list directory users', async () => {
  // Setup mock response for listing directory users
  const mockResponse = {
    data: [mockResponses.directoryUser],
    list_metadata: {
      before: null,
      after: null,
    },
    object: 'list',
  };

  const { workos, client } = createMockWorkOS(mockResponse);
  const directoryId = 'directory_123';

  // Execute the method - this method has been renamed or removed
  // @ts-ignore: Using deprecated method for tests
  const usersResult = await workos.directorySync.listUsers({
    directory: directoryId,
  });

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, '/directory_users');
  assertEquals(requestDetails.method, 'GET');
  assertExists(requestDetails.params);
  if (requestDetails.params) {
    assertEquals(requestDetails.params.directory, directoryId);
  }

  // Verify the response was parsed correctly
  assertExists(usersResult.data);
  assertEquals(usersResult.data[0].id, mockResponses.directoryUser.id);
  assertEquals(usersResult.data[0].email, mockResponses.directoryUser.email);
});
