import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert@^1";
import {
  clearTemplateCache,
  enhanceMustacheWithCaching,
  getTemplateCacheSize,
} from "./mustache_cache.ts";

// Test mock for Mustache-like interface
interface MockMustache {
  render: (
    template: string,
    view: unknown,
    partials?: Record<string, string>,
  ) => string;
  parse: (template: string) => unknown;
  parseCallCount: number;
}

// Create a mock implementation for testing
function createMockMustache(): MockMustache {
  return {
    parseCallCount: 0,
    render: (template: string, view: unknown): string => {
      // Simple render function that replaces {{key}} with view[key]
      return template.replace(
        /\{\{([^}]+)\}\}/g,
        (_match, key) => (view as Record<string, string>)[key] || "",
      );
    },
    parse: function (template: string): unknown {
      this.parseCallCount++;
      // Simple parse function that returns tokens
      return template.split(/\{\{([^}]+)\}\}/g);
    },
  };
}

Deno.test("Mustache Cache - Basic caching functionality", () => {
  // Create a mock Mustache implementation
  const mockMustache = createMockMustache();

  // Enhance with caching
  enhanceMustacheWithCaching(mockMustache);

  // First render should call parse
  const template = "Hello, {{name}}!";
  const view = { name: "World" };

  const result1 = mockMustache.render(template, view);
  assertEquals(result1, "Hello, World!");
  assertEquals(mockMustache.parseCallCount, 1, "Parse should be called once");

  // Second render should not call parse again (cache hit)
  const result2 = mockMustache.render(template, view);
  assertEquals(result2, "Hello, World!");
  assertEquals(
    mockMustache.parseCallCount,
    1,
    "Parse should only be called once",
  );

  // Different template should call parse
  const template2 = "Goodbye, {{name}}!";
  const result3 = mockMustache.render(template2, view);
  assertEquals(result3, "Goodbye, World!");
  assertEquals(
    mockMustache.parseCallCount,
    2,
    "New template should trigger parse",
  );
});

Deno.test("Mustache Cache - Cache size tracking", () => {
  // Clear the cache
  clearTemplateCache();
  assertEquals(getTemplateCacheSize(), 0, "Cache should start empty");

  // Create a mock Mustache implementation
  const mockMustache = createMockMustache();
  enhanceMustacheWithCaching(mockMustache);

  // Render multiple templates
  mockMustache.render("Template 1: {{value}}", { value: "test" });
  assertEquals(getTemplateCacheSize(), 1, "Cache should contain 1 template");

  mockMustache.render("Template 2: {{value}}", { value: "test" });
  assertEquals(getTemplateCacheSize(), 2, "Cache should contain 2 templates");

  // Repeat template shouldn't increase size
  mockMustache.render("Template 1: {{value}}", { value: "different" });
  assertEquals(
    getTemplateCacheSize(),
    2,
    "Cache size should not change for repeated templates",
  );

  // Clear cache
  clearTemplateCache();
  assertEquals(
    getTemplateCacheSize(),
    0,
    "Cache should be empty after clearing",
  );
});

Deno.test("Mustache Cache - Performance tracking", async () => {
  // Create a mock Mustache implementation
  const mockMustache = createMockMustache();
  enhanceMustacheWithCaching(mockMustache);

  // Set environment variable to bypass performance tracking
  Deno.env.set("CODEGEN_PERF_IGNORE", "true");

  // Render template
  const template = "{{greeting}}, {{name}}!";
  const result = mockMustache.render(template, {
    greeting: "Hello",
    name: "World",
  });
  assertEquals(result, "Hello, World!");

  // Reset environment
  Deno.env.delete("CODEGEN_PERF_IGNORE");

  // Check if cache works
  assertEquals(
    getTemplateCacheSize(),
    1,
    "Template should be cached even with perf tracking disabled",
  );
});
