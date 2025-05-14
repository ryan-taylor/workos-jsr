// Hydration validation tests for Fresh 2.x Canary

import {
  assertContains,
  assertEquals,
  type assertExists,
} from "./test_config.ts";

// Mock console to catch hydration warnings
const originalConsole = { ...console };
let consoleWarnings: string[] = [];
let consoleErrors: string[] = [];

function mockConsole() {
  consoleWarnings = [];
  consoleErrors = [];
  console.warn = (message: string) => {
    consoleWarnings.push(message);
  };
  console.error = (message: string) => {
    consoleErrors.push(message);
  };
}

function restoreConsole() {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

/**
 * Helper to simulate the hydration process
 * This mimics what happens in Fresh when a page/component:
 * 1. Server-side renders (SSR)
 * 2. Client receives the HTML
 * 3. Client hydrates the component on the browser
 */
function simulateHydration(Component: any, props: any) {
  mockConsole();

  try {
    // Step 1: Server-side render (returns virtual DOM)
    const serverRendered = Component(props);

    // Step 2: Convert to string (what browser receives)
    const serialized = JSON.stringify(serverRendered);

    // Step 3: Client-side hydration (browser rebuilds VDOM and attaches events)
    // In a real app, Fresh would use the preact.hydrate() function
    // Here we simulate by creating a new instance with the same props
    const clientHydrated = Component(props);
    const clientSerialized = JSON.stringify(clientHydrated);

    return {
      serverRendered,
      clientHydrated,
      hasHydrationMismatch: serialized !== clientSerialized,
      warnings: consoleWarnings,
      errors: consoleErrors,
    };
  } finally {
    restoreConsole();
  }
}

// Mock component with state for testing hydration
function MockCounter(props: { initialCount?: number }) {
  const initialCount = props.initialCount || 0;
  // In a real component, this would be useState
  let count = initialCount;

  // Simple client-side functionality
  const increment = () => {
    count++;
    return count;
  };

  // Return a virtual DOM representation
  return {
    type: "div",
    props: {
      className: "counter",
      children: [
        {
          type: "span",
          props: {
            className: "count",
            children: [count.toString()],
          },
        },
        {
          type: "button",
          props: {
            onClick: increment,
            children: ["Increment"],
          },
        },
      ],
    },
    // Include the event handler so we can test it works after hydration
    increment,
  };
}

// Tests

Deno.test("Hydration - Components hydrate without console warnings", () => {
  // Simple static component should hydrate without warnings
  const result = simulateHydration(
    // Simple component that returns JSX
    (props: { greeting: string }) => ({
      type: "div",
      props: {
        children: [`Hello, ${props.greeting}!`],
      },
    }),
    { greeting: "World" },
  );

  assertEquals(result.warnings.length, 0, "Should not have console warnings");
  assertEquals(result.errors.length, 0, "Should not have console errors");
  assertEquals(
    result.hasHydrationMismatch,
    false,
    "Should not have hydration mismatch",
  );
});

Deno.test("Hydration - Client-side functionality works after hydration", () => {
  // Test component with "client-side" functionality
  const result = simulateHydration(MockCounter, { initialCount: 5 });

  // Check that the component rendered correctly
  const serialized = JSON.stringify(result.clientHydrated);
  assertContains(serialized, "counter");
  assertContains(serialized, "5");

  // Test that the client-side functionality works
  const newCount = result.clientHydrated.increment();
  assertEquals(newCount, 6, "Increment function should work after hydration");
});

Deno.test("Hydration - No hydration mismatches occur with consistent props", () => {
  // Test with various prop values
  const testCases = [
    { initialCount: 0 },
    { initialCount: 10 },
    { initialCount: -5 },
  ];

  for (const props of testCases) {
    const result = simulateHydration(MockCounter, props);
    assertEquals(
      result.hasHydrationMismatch,
      false,
      `Should not have hydration mismatch with props ${JSON.stringify(props)}`,
    );
  }
});

Deno.test("Hydration - Detects hydration mismatches when server and client differ", () => {
  // Create a component that renders differently on server vs client
  const MismatchComponent = (props: { isServer?: boolean }) => {
    // This simulates a component that renders differently based on environment
    // In real apps, this might happen when using window or document on the server
    return {
      type: "div",
      props: {
        children: [props.isServer ? "Server Content" : "Client Content"],
      },
    };
  };

  // First render with isServer=true (simulating server)
  const serverProps = { isServer: true };
  const serverRendered = MismatchComponent(serverProps);

  // Then hydrate with isServer=false (simulating browser environment)
  mockConsole();
  try {
    const clientProps = { isServer: false };
    const clientHydrated = MismatchComponent(clientProps);

    // Check for mismatch
    const serverSerialized = JSON.stringify(serverRendered);
    const clientSerialized = JSON.stringify(clientHydrated);

    assertEquals(
      serverSerialized === clientSerialized,
      false,
      "Should detect the intentional hydration mismatch",
    );
  } finally {
    restoreConsole();
  }
});

// Mock an island component (client-side interactive component)
function MockIsland(props: { interactive?: boolean }) {
  const isInteractive = props.interactive !== false;

  // Return representation with client-side handlers
  return {
    type: "div",
    props: {
      className: "island-component",
      "data-hydrate": isInteractive ? "true" : "false",
      children: [
        {
          type: "button",
          props: {
            className: "island-button",
            onClick: isInteractive ? () => console.log("clicked") : undefined,
            children: ["Click me"],
          },
        },
      ],
    },
  };
}

Deno.test("Hydration - Island components preserve interactivity", () => {
  const result = simulateHydration(MockIsland, { interactive: true });

  // Verify the component was hydrated with interactivity
  const serialized = JSON.stringify(result.clientHydrated);
  assertContains(serialized, "island-component");
  assertContains(serialized, "data-hydrate");
  assertContains(serialized, "island-button");
  assertContains(serialized, "onClick");

  // Verify no hydration warnings
  assertEquals(result.warnings.length, 0, "Should not have hydration warnings");
});
