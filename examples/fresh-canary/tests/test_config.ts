// Test configuration for Preact components in Fresh 2.x Canary

// Define types needed for testing
export type TestContext = {
  rendered: string;
  container: {
    querySelector: (selector: string) => TestElement | null;
    querySelectorAll: (selector: string) => TestElement[];
  };
};

export type TestElement = {
  tagName: string;
  innerHTML: string;
  textContent: string;
  value?: string;
  className?: string;
  getAttribute: (name: string) => string | null;
  querySelector: (selector: string) => TestElement | null;
  querySelectorAll: (selector: string) => TestElement[];
};

// Mock fetch API for testing
const originalFetch = globalThis.fetch;
export function mockFetch(mockResponse: Response): void {
  globalThis.fetch = () => Promise.resolve(mockResponse);
}

export function mockFetchJson(data: unknown, status = 200): void {
  mockFetch(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

export function mockFetchRedirect(url: string): void {
  const response = new Response(null, {
    status: 302,
    headers: { Location: url },
  });
  // Add a redirected property to mock browser redirect behavior
  Object.defineProperty(response, "redirected", { value: true });
  Object.defineProperty(response, "url", { value: url });
  mockFetch(response);
}

export function mockFetchError(status = 400, message = "Bad Request"): void {
  mockFetch(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

export function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

// Mock window.location for testing
const originalLocation = globalThis.location;
export function mockLocation(href = "http://localhost:8000"): void {
  Object.defineProperty(globalThis, "location", {
    value: {
      href,
      assign: (url: string) => {
        globalThis.location.href = url;
      },
    },
    writable: true,
  });
}

export function restoreLocation(): void {
  Object.defineProperty(globalThis, "location", {
    value: originalLocation,
    writable: true,
  });
}

// Mock DOM elements and events
export function mockInputEvent(value: string): Event {
  return {
    preventDefault: () => {},
    target: { value },
  } as unknown as Event;
}

export function mockFormSubmitEvent(): Event {
  return {
    preventDefault: () => {},
  } as unknown as Event;
}

// Create a mock Preact render function that returns a simplified DOM
export function render(component: unknown): TestContext {
  // This is a very simplified implementation - in a real test we would use a real renderer
  // For our tests, we'll return a mock DOM representation
  const rendered = JSON.stringify(component);
  
  // Create a mock container with querySelector implementation
  const container = {
    querySelector: (selector: string): TestElement | null => {
      // A very simplified implementation - just check if something matching the selector exists in the rendered string
      if (selector.startsWith(".") && rendered.includes(`class="${selector.substring(1)}"`)) {
        return createMockElement(selector.substring(1));
      }
      if (selector.startsWith("#") && rendered.includes(`id="${selector.substring(1)}"`)) {
        return createMockElement("div", selector.substring(1));
      }
      if (rendered.includes(`<${selector}`)) {
        return createMockElement(selector);
      }
      return null;
    },
    querySelectorAll: (selector: string): TestElement[] => {
      const element = container.querySelector(selector);
      return element ? [element] : [];
    },
  };
  
  return { rendered, container };
}

function createMockElement(tagName: string, id?: string): TestElement {
  return {
    tagName,
    innerHTML: `<${tagName}>${id ? id : ""}</${tagName}>`,
    textContent: id || "",
    className: "",
    getAttribute: (name: string) => name === "id" ? id || null : null,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

// Mock WorkOSUser for testing
export function createMockUser(overrides = {}) {
  return {
    id: "user_123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    profilePictureUrl: null,
    ...overrides,
  };
}

// Helper functions for assertions
export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
  }
}

export function assertExists(value: unknown, msg?: string): void {
  if (value === null || value === undefined) {
    throw new Error(msg || "Expected value to exist, but got null or undefined");
  }
}

// Helper function to check if a string contains a substring
export function assertContains(str: string, substring: string, msg?: string): void {
  if (!str.includes(substring)) {
    throw new Error(msg || `Expected "${str}" to contain "${substring}"`);
  }
}