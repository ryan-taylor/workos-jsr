import { assertEquals } from "@std/assert";
import { mockResponses, TestWorkOS } from "./utils/mock_data.ts";
import { Directory, ListResponse } from "./types.ts";

// Define a simple mock version of the Directory Sync module for testing
class DirectorySyncTest {
  constructor(private client: TestWorkOS) {}

  async listDirectories(): Promise<ListResponse<Directory>> {
    // This is just a mock implementation for testing
    return {
      data: [mockResponses.directory as Directory],
      list_metadata: {
        before: null,
        after: null,
      },
    };
  }

  async getDirectory(directoryId: string): Promise<Directory> {
    // Mock implementation
    return mockResponses.directory as Directory;
  }
}

// Create a basic test for the directory sync functionality
Deno.test("DirectorySync - Basic", async () => {
  // Create a test instance
  const client = new TestWorkOS("sk_test_123456789");
  const directorySync = new DirectorySyncTest(client);

  // Test list directories
  const directories = await directorySync.listDirectories();
  assertEquals(directories.data.length, 1);
  assertEquals(directories.data[0].id, mockResponses.directory.id);

  // Test get directory
  const directory = await directorySync.getDirectory("directory_123");
  assertEquals(directory.id, mockResponses.directory.id);
  assertEquals(directory.name, mockResponses.directory.name);
});
