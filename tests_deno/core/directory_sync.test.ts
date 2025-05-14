import { assertEquals, assertExists } from "@std/assert";
import { createMockWorkOS, mockResponses } from "../utils/test_helpers.ts";
import { fetchAndDeserialize } from "../../packages/workos_sdk/src/common/utils/fetch-and-deserialize.ts";
import { deserializeDirectory, deserializeDirectoryGroup, deserializeDirectoryUser } from "../../packages/workos_sdk/src/directory-sync/serializers/index.ts";

/**
 * Directory Sync Tests
 * These tests verify the basic functionality of the Directory Sync module in Deno,
 * focusing specifically on the fetch-and-deserialize functionality which is what we fixed.
 */
Deno.test("DirectorySync: list directories via fetch-and-deserialize", async () => {
  // Setup mock response for listing directories
  const mockResponse = {
    data: [mockResponses.directory],
    list_metadata: {
      before: null,
      after: null,
    },
    object: "list",
  };

  const { workos, client } = createMockWorkOS(mockResponse);

  // Use fetch-and-deserialize directly, bypassing the generated API client
  const directoriesResult = await fetchAndDeserialize(
    workos, 
    "/directories", 
    deserializeDirectory
  );

  // Verify the request was correctly tracked by our mock client
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, "/directories");
  assertEquals(requestDetails.method, "GET");

  // Verify the response format matches what tests expect
  if ('data' in directoriesResult) {
    assertExists(directoriesResult.data);
    assertEquals(directoriesResult.data[0].id, mockResponses.directory.id);
    assertEquals(directoriesResult.data[0].name, mockResponses.directory.name);
  } else {
    throw new Error("Expected list response with data property");
  }
});

Deno.test("DirectorySync: get directory via fetch-and-deserialize", async () => {
  const { workos, client } = createMockWorkOS(mockResponses.directory);
  const directoryId = "directory_123";

  // Use fetch-and-deserialize directly
  const directoryResult = await fetchAndDeserialize(
    workos, 
    `/directories/${directoryId}`, 
    deserializeDirectory
  );

  // Verify the request details
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, `/directories/${directoryId}`);
  assertEquals(requestDetails.method, "GET");

  // Our fetch-and-deserialize can return a single object or a list
  // depending on implementation details - handle both cases
  if ('data' in directoryResult) {
    // If it's a list with one item, extract the first item
    const directory = Array.isArray(directoryResult.data) ? 
      directoryResult.data[0] : directoryResult.data;
    
    assertEquals(directory.id, mockResponses.directory.id);
    assertEquals(directory.name, mockResponses.directory.name);
  } else if (Array.isArray(directoryResult)) {
    // If it's an array, take the first item
    assertEquals(directoryResult[0].id, mockResponses.directory.id);
    assertEquals(directoryResult[0].name, mockResponses.directory.name);
  } else {
    // If it's a single object
    assertEquals(directoryResult.id, mockResponses.directory.id);
    assertEquals(directoryResult.name, mockResponses.directory.name);
  }
});

Deno.test("DirectorySync: list directory groups via fetch-and-deserialize", async () => {
  // Setup mock response for listing directory groups
  const mockResponse = {
    data: [mockResponses.directoryGroup],
    list_metadata: {
      before: null,
      after: null,
    },
    object: "list",
  };

  const { workos, client } = createMockWorkOS(mockResponse);
  const directoryId = "directory_123";

  // Use fetch-and-deserialize directly with a record for query params
  // Using type assertion to bypass PaginationOptions constraints
  const queryParams = { directory: directoryId } as Record<string, unknown>;
  const groupsResult = await fetchAndDeserialize(
    workos, 
    "/directory_groups", 
    deserializeDirectoryGroup,
    queryParams
  );

  // Verify the request details
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, "/directory_groups");
  assertEquals(requestDetails.method, "GET");
  assertExists(requestDetails.params);
  if (requestDetails.params) {
    assertEquals(requestDetails.params.directory, directoryId);
  }

  // Verify the response structure
  if ('data' in groupsResult) {
    assertExists(groupsResult.data);
    assertEquals(groupsResult.data[0].id, mockResponses.directoryGroup.id);
    assertEquals(groupsResult.data[0].name, mockResponses.directoryGroup.name);
  } else {
    throw new Error("Expected list response with data property");
  }
});

Deno.test("DirectorySync: list directory users via fetch-and-deserialize", async () => {
  // Setup mock response for listing directory users
  const mockResponse = {
    data: [mockResponses.directoryUser],
    list_metadata: {
      before: null,
      after: null,
    },
    object: "list",
  };

  const { workos, client } = createMockWorkOS(mockResponse);
  const directoryId = "directory_123";

  // Use fetch-and-deserialize directly with a record for query params
  // Using type assertion to bypass PaginationOptions constraints
  const queryParams = { directory: directoryId } as Record<string, unknown>;
  const usersResult = await fetchAndDeserialize(
    workos, 
    "/directory_users", 
    deserializeDirectoryUser,
    queryParams
  );

  // Verify the request details
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.url, "/directory_users");
  assertEquals(requestDetails.method, "GET");
  assertExists(requestDetails.params);
  if (requestDetails.params) {
    assertEquals(requestDetails.params.directory, directoryId);
  }

  // Verify the response structure
  if ('data' in usersResult) {
    assertExists(usersResult.data);
    assertEquals(usersResult.data[0].id, mockResponses.directoryUser.id);
    assertEquals(usersResult.data[0].email, mockResponses.directoryUser.email);
  } else {
    throw new Error("Expected list response with data property");
  }
});
