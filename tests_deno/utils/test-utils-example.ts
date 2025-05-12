/**
 * Example test file demonstrating the use of test-utils.ts
 * 
 * This shows how to:
 * 1. Mock fetch requests
 * 2. Use spy functions
 * 3. Use the test helpers with Deno.test
 */

import {
  mockResponse,
  mockResponseOnce,
  resetMockFetch,
  fetchUtils,
  spy,
  testWithContext,
  createTestGroup,
  setupFetchMock
} from "./test-utils.ts";

// Example: Create a test group with shared setup/teardown
const testGroup = createTestGroup({
  beforeEach: () => {
    // Setup fetch mocking for each test
    setupFetchMock();
    console.log("Test setup complete");
  },
  afterEach: () => {
    // Reset mocks after each test
    resetMockFetch();
    console.log("Test cleanup complete");
  },
});

// Example: Using the test group to run tests with shared setup/teardown
testGroup.test("mockResponse returns the configured response", async () => {
  const mockData = { message: "success", id: 123 };
  
  // Configure the mock fetch to return our data
  mockResponse(mockData);
  
  // Make the request
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
  
  // Verify the response
  console.assert(data.message === "success", "Response message should be 'success'");
  console.assert(data.id === 123, "Response id should be 123");
  
  // Check that fetch was called with the expected URL
  console.assert(fetchUtils.url() === "https://api.example.com/data", 
    "Fetch should be called with the correct URL");
});

// Example: Using testWithContext for individual test with setup/teardown
testWithContext("mockResponseOnce returns the configured response once", async () => {
  const uninstall = setupFetchMock();
  try {
    // Configure mockFetch to return different responses
    mockResponseOnce({ first: true });
    mockResponseOnce({ second: true });
    
    // First request gets first response
    const resp1 = await fetch("https://api.example.com/first");
    const data1 = await resp1.json();
    console.assert(data1.first === true, "First response should have first=true");
    
    // Second request gets second response
    const resp2 = await fetch("https://api.example.com/second");
    const data2 = await resp2.json();
    console.assert(data2.second === true, "Second response should have second=true");
    
    // Verify the calls
    const calls = fetchUtils.calls();
    console.assert(calls.length === 2, "Fetch should be called twice");
    console.assert(calls[0][0] === "https://api.example.com/first",
      "First call should be to /first");
    console.assert(calls[1][0] === "https://api.example.com/second",
      "Second call should be to /second");
  } finally {
    uninstall();
  }
});

// Example: Using mockFetch with a custom implementation
testWithContext("mockFetch can be used with custom implementation", async () => {
  const uninstall = setupFetchMock();
  try {
    // Use mockFetch directly with a custom implementation
    const requestSpy = spy();
    
    // Replace the global fetch with our custom implementation via mockFetch
    globalThis.fetch = ((url, init) => {
      requestSpy(url, init);
      return Promise.resolve(new Response(JSON.stringify({ custom: true }), {
        headers: { 'content-type': 'application/json' }
      }));
    }) as typeof fetch;
    
    // Make a request
    const response = await fetch("https://api.example.com/custom", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "value" })
    });
    
    const data = await response.json();
    
    // Verify our custom implementation was used
    console.assert(data.custom === true, "Response should have custom=true");
    console.assert(requestSpy.calls.length === 1, "Request spy should be called once");
    console.assert(requestSpy.calls[0][0] === "https://api.example.com/custom",
      "Custom implementation should receive correct URL");
  } finally {
    uninstall();
  }
});

// Example: Using spy to mock and track function calls
Deno.test("spy tracks function calls and returns configured values", () => {
  // Create a spy function
  const greet = spy((name: string) => `Hello, ${name}!`);
  
  // Call the function
  const result1 = greet("Alice");
  const result2 = greet("Bob");
  
  // Verify the spy tracked the calls
  console.assert(greet.calls.length === 2, "Spy should track 2 calls");
  console.assert(greet.calls[0][0] === "Alice", "First call should be with 'Alice'");
  console.assert(greet.calls[1][0] === "Bob", "Second call should be with 'Bob'");
  
  // Verify the results
  console.assert(result1 === "Hello, Alice!", "Result should be 'Hello, Alice!'");
  console.assert(result2 === "Hello, Bob!", "Result should be 'Hello, Bob!'");
  
  // Configure the spy to return a different value
  greet.mockReturnValue("Hi there!");
  const result3 = greet("Charlie");
  
  // Verify the new result
  console.assert(result3 === "Hi there!", "Result should be 'Hi there!'");
  
  // Mock implementation
  greet.mockImplementation((name) => `Hey ${name}!`);
  const result4 = greet("Dave");
  
  // Verify the new implementation
  console.assert(result4 === "Hey Dave!", "Result should use new implementation");
  
  // Reset the spy
  greet.mockReset();
  
  // Verify the spy was reset
  console.assert(greet.calls.length === 0, "Spy calls should be reset");
});