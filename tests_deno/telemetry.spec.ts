import { assertEquals, assertExists, assertNotEquals } from "@std/assert";

/**
 * Tests for the Telemetry module
 * Covers:
 * - Instrumentation of WorkOS core methods
 * - Instrumentation of module methods (SSO, DirectorySync, etc.)
 * - Telemetry manager functionality
 * - OTLP exporter
 */

// Mock WorkOS instance for testing
class MockWorkOS {
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastData: unknown = null;
  private mockResponseData: unknown;
  private shouldThrow = false;

  constructor(mockResponse: unknown = {}, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async get<T>(path: string, options = {}): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "get";

    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }

    return { data: this.mockResponseData as T };
  }

  async post<T>(
    path: string,
    entity?: unknown,
    options = {},
  ): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "post";
    this.lastData = entity;

    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }

    return { data: this.mockResponseData as T };
  }

  async put<T>(
    path: string,
    entity?: unknown,
    options = {},
  ): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "put";
    this.lastData = entity;

    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }

    return { data: this.mockResponseData as T };
  }

  async delete(path: string, query?: unknown): Promise<void> {
    this.lastPath = path;
    this.lastMethod = "delete";
    this.lastData = query;

    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      data: this.lastData,
    };
  }
}

// Mock SSO class for testing instrumentation
class MockSSO {
  getAuthorizationUrl(
    options: { connection?: string; organization?: string; domain?: string },
  ) {
    return "https://api.workos.com/sso/authorize?client_id=client_123&redirect_uri=https://example.com/callback";
  }

  async getProfile(options: { code: string }) {
    return {
      id: "profile_123",
      email: "user@example.com",
    };
  }
}

// Mock DirectorySync class for testing instrumentation
class MockDirectorySync {
  async listUsers(options: { directory?: string } = {}) {
    return {
      data: [
        { id: "user_1", email: "user1@example.com" },
        { id: "user_2", email: "user2@example.com" },
      ],
      list_metadata: {
        before: null,
        after: null,
      },
    };
  }
}

// Mock UserManagement class for testing instrumentation
class MockUserManagement {
  async authenticateWithPassword(options: { email: string; password: string }) {
    return {
      user: {
        id: "user_123",
        email: options.email,
      },
      access_token: "token_xyz",
    };
  }
}

// Mock implementation of the SpanStatus enum
enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

// Mock implementation of the TelemetryManager
class MockTelemetryManager {
  private spans: Map<string, unknown> = new Map();
  private metrics: unknown[] = [];
  private logs: unknown[] = [];
  private spansExported = 0;
  private metricsExported = 0;
  private logsExported = 0;

  startSpan(name: string, attributes = {}, parentSpanId?: string): string {
    const spanId = `span_${Math.random().toString(36).substring(2, 9)}`;
    this.spans.set(spanId, { name, attributes, startTime: Date.now() });
    return spanId;
  }

  endSpan(
    spanId: string,
    status = SpanStatus.OK,
    message?: string,
    attributes = {},
  ): void {
    if (this.spans.has(spanId)) {
      const span = this.spans.get(spanId);
      this.spans.delete(spanId);
      // In a real implementation, this would add the span to a batch for export
    }
  }

  recordMetric(
    name: string,
    value: number | {
      count: number;
      sum: number;
      buckets: { count: number; upperBound: number }[];
    },
    type = "counter",
    attributes = {},
  ): void {
    this.metrics.push({ name, value, type, attributes });
  }

  recordLog(
    body: string,
    severity = 9,
    attributes = {},
    spanId?: string,
  ): void {
    this.logs.push({ body, severity, attributes, spanId });
  }

  async flush(): Promise<void> {
    this.spansExported += this.spans.size;
    this.spans.clear();
    this.metricsExported += this.metrics.length;
    this.metrics = [];
    this.logsExported += this.logs.length;
    this.logs = [];
  }

  getExportStats() {
    return {
      spansExported: this.spansExported,
      metricsExported: this.metricsExported,
      logsExported: this.logsExported,
    };
  }

  // Helper to check if a specific span exists
  hasSpan(spanId: string): boolean {
    return this.spans.has(spanId);
  }

  // Helper to get metrics count
  getMetricsCount(): number {
    return this.metrics.length;
  }

  // Helper to get logs count
  getLogsCount(): number {
    return this.logs.length;
  }
}

// Import the real telemetry module and mock it
import { telemetry } from "../src/telemetry/telemetry-manager.ts";
import {
  instrumentDirectorySync,
  instrumentSSO,
  instrumentUserManagement,
  instrumentWorkOSCore,
} from "../src/telemetry/instrumentation.ts";
import { OTLPHttpExporter } from "../src/telemetry/otlp-exporter.ts";

// Create a test instance of telemetry manager
const mockTelemetryManager = new MockTelemetryManager();

// Tests for WorkOS core instrumentation
Deno.test("Telemetry - instrumentWorkOSCore wraps HTTP methods correctly", async () => {
  const mockWorkos = new MockWorkOS({ id: "123", name: "Test" });

  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes: Record<string, unknown> = {};

  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (
      name: string,
      attributes = {},
      parentSpanId?: string,
    ): string => {
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (
      spanId: string,
      status = SpanStatus.OK,
      message?: string,
      attributes = {},
    ): void => {
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
  };

  // Replace global telemetry with our tracked mock
  const originalTelemetry = { ...telemetry };
  Object.assign(telemetry, trackedManager);

  try {
    // Instrument the WorkOS instance
    instrumentWorkOSCore(mockWorkos as any);

    // Test GET method
    await mockWorkos.get("/test/path");

    // Verify correct API call was made
    const lastRequest = mockWorkos.getLastRequest();
    assertEquals(lastRequest.path, "/test/path");
    assertEquals(lastRequest.method, "get");

    // Verify telemetry was captured
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "workos.get");
    assertEquals(lastSpanAttributes["http.method"], "GET");

    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;

    // Test POST method
    await mockWorkos.post("/test/post", { key: "value" });

    const postRequest = mockWorkos.getLastRequest();
    assertEquals(postRequest.path, "/test/post");
    assertEquals(postRequest.method, "post");
    assertEquals(postRequest.data, { key: "value" });

    // Verify telemetry capture for POST
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "workos.post");

    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;

    // Test PUT method
    await mockWorkos.put("/test/put", { update: true });

    const putRequest = mockWorkos.getLastRequest();
    assertEquals(putRequest.path, "/test/put");
    assertEquals(putRequest.method, "put");
    assertEquals(putRequest.data, { update: true });

    // Verify telemetry capture for PUT
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "workos.put");

    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;

    // Test DELETE method
    await mockWorkos.delete("/test/delete");

    const deleteRequest = mockWorkos.getLastRequest();
    assertEquals(deleteRequest.path, "/test/delete");
    assertEquals(deleteRequest.method, "delete");

    // Verify telemetry capture for DELETE
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "workos.delete");
  } finally {
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});

Deno.test("Telemetry - instrumentWorkOSCore handles errors correctly", async () => {
  const mockWorkos = new MockWorkOS({}, true); // Will throw errors

  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let lastStatus = SpanStatus.UNSET;

  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (
      name: string,
      attributes = {},
      parentSpanId?: string,
    ): string => {
      startSpanCalls++;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (
      spanId: string,
      status = SpanStatus.OK,
      message?: string,
      attributes = {},
    ): void => {
      endSpanCalls++;
      lastStatus = status;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
  };

  // Replace global telemetry with our tracked mock
  const originalTelemetry = { ...telemetry };
  Object.assign(telemetry, trackedManager);

  try {
    // Instrument the WorkOS instance
    instrumentWorkOSCore(mockWorkos as any);

    // Test GET method with error
    try {
      await mockWorkos.get("/test/path");
    } catch (error) {
      // Expected error
    }

    // Verify telemetry was captured with error status
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastStatus, SpanStatus.ERROR);

    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;
    lastStatus = SpanStatus.UNSET;

    // Test POST method with error
    try {
      await mockWorkos.post("/test/post", { key: "value" });
    } catch (error) {
      // Expected error
    }

    // Verify telemetry captures the error
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastStatus, SpanStatus.ERROR);
  } finally {
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});

// Tests for SSO instrumentation
Deno.test("Telemetry - instrumentSSO wraps methods correctly", async () => {
  const mockSso = new MockSSO();

  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes: Record<string, unknown> = {};
  let lastMetricName = "";

  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (
      name: string,
      attributes = {},
      parentSpanId?: string,
    ): string => {
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (
      spanId: string,
      status = SpanStatus.OK,
      message?: string,
      attributes = {},
    ): void => {
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (
      name: string,
      value: any,
      type = "counter",
      attributes = {},
    ) => {
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    },
  };

  // Replace global telemetry with our tracked mock
  const originalTelemetry = { ...telemetry };
  Object.assign(telemetry, trackedManager);

  try {
    // Instrument the SSO instance
    instrumentSSO(mockSso as any);

    // Test getAuthorizationUrl method
    mockSso.getAuthorizationUrl({
      connection: "conn_123",
      organization: "org_123",
      domain: "example.com",
    });

    // Verify telemetry was captured
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "sso.getAuthorizationUrl");
    assertEquals(lastSpanAttributes["workos.module"], "sso");
    assertEquals(lastSpanAttributes["sso.connection"], "conn_123");

    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;
    recordMetricCalls = 0;

    // Test getProfile method
    await mockSso.getProfile({ code: "code_123" });

    // Verify telemetry was captured with metrics
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(recordMetricCalls, 1);
    assertEquals(lastSpanName, "sso.getProfile");
    assertEquals(lastMetricName, "sso.profile_requests");
  } finally {
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});

// Tests for DirectorySync instrumentation
Deno.test("Telemetry - instrumentDirectorySync wraps methods correctly", async () => {
  const mockDirectorySync = new MockDirectorySync();

  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes: Record<string, unknown> = {};
  let lastMetricName = "";

  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (
      name: string,
      attributes = {},
      parentSpanId?: string,
    ): string => {
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (
      spanId: string,
      status = SpanStatus.OK,
      message?: string,
      attributes = {},
    ): void => {
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (
      name: string,
      value: any,
      type = "counter",
      attributes = {},
    ) => {
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    },
  };

  // Replace global telemetry with our tracked mock
  const originalTelemetry = { ...telemetry };
  Object.assign(telemetry, trackedManager);

  try {
    // Instrument the DirectorySync instance
    instrumentDirectorySync(mockDirectorySync as any);

    // Test listUsers method
    await mockDirectorySync.listUsers({ directory: "dir_123" });

    // Verify telemetry was captured
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(recordMetricCalls, 1);
    assertEquals(lastSpanName, "directorySync.listUsers");
    assertEquals(lastSpanAttributes["workos.module"], "directorySync");
    assertEquals(lastSpanAttributes["directorySync.directory"], "dir_123");
    assertEquals(lastMetricName, "directory_sync.user_queries");
  } finally {
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});

// Tests for UserManagement instrumentation
Deno.test("Telemetry - instrumentUserManagement wraps methods correctly", async () => {
  const mockUserManagement = new MockUserManagement();

  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes: Record<string, unknown> = {};
  let lastMetricName = "";

  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (
      name: string,
      attributes = {},
      parentSpanId?: string,
    ): string => {
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (
      spanId: string,
      status = SpanStatus.OK,
      message?: string,
      attributes = {},
    ): void => {
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (
      name: string,
      value: any,
      type = "counter",
      attributes = {},
    ) => {
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    },
  };

  // Replace global telemetry with our tracked mock
  const originalTelemetry = { ...telemetry };
  Object.assign(telemetry, trackedManager);

  try {
    // Instrument the UserManagement instance
    instrumentUserManagement(mockUserManagement as any);

    // Test authenticateWithPassword method
    await mockUserManagement.authenticateWithPassword({
      email: "user@example.com",
      password: "password123",
    });

    // Verify telemetry was captured
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(recordMetricCalls, 1);
    assertEquals(lastSpanName, "userManagement.authenticateWithPassword");
    assertEquals(lastSpanAttributes["workos.module"], "userManagement");
    assertEquals(lastSpanAttributes["auth.method"], "password");
    assertEquals(lastSpanAttributes["user.email_domain"], "example.com");
    assertEquals(lastMetricName, "user_management.authentication_attempts");
  } finally {
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});

// Tests for TelemetryManager functionality
Deno.test("Telemetry - TelemetryManager span lifecycle", () => {
  const manager = new MockTelemetryManager();

  // Start a span
  const spanId = manager.startSpan("test.operation", {
    "custom.attribute": "value",
  });

  // Verify span is active
  assertEquals(manager.hasSpan(spanId), true);

  // End the span
  manager.endSpan(spanId, SpanStatus.OK);

  // Verify span is no longer active
  assertEquals(manager.hasSpan(spanId), false);
});

Deno.test("Telemetry - TelemetryManager recordMetric", () => {
  const manager = new MockTelemetryManager();

  // Record a counter metric
  manager.recordMetric("test.counter", 1, "counter", {
    "custom.attribute": "value",
  });

  // Verify metric was recorded
  assertEquals(manager.getMetricsCount(), 1);

  // Record a gauge metric
  manager.recordMetric("test.gauge", 42.5, "gauge", {
    "custom.attribute": "value",
  });

  // Verify another metric was recorded
  assertEquals(manager.getMetricsCount(), 2);
});

Deno.test("Telemetry - TelemetryManager recordLog", () => {
  const manager = new MockTelemetryManager();

  // Record a log
  manager.recordLog("Test log message", 9, { "custom.attribute": "value" });

  // Verify log was recorded
  assertEquals(manager.getLogsCount(), 1);

  // Record another log with different severity
  manager.recordLog("Error log message", 17, { "error": true });

  // Verify another log was recorded
  assertEquals(manager.getLogsCount(), 2);
});

Deno.test("Telemetry - TelemetryManager flush", async () => {
  const manager = new MockTelemetryManager();

  // Start some spans, record metrics and logs
  const spanId1 = manager.startSpan("test.span1");
  const spanId2 = manager.startSpan("test.span2");
  manager.recordMetric("test.metric", 1);
  manager.recordLog("Test log");

  // End one span, leaving the other active
  manager.endSpan(spanId1);

  // Flush all data
  await manager.flush();

  // Verify export stats
  const stats = manager.getExportStats();
  assertEquals(stats.spansExported > 0, true);
  assertEquals(stats.metricsExported > 0, true);
  assertEquals(stats.logsExported > 0, true);
});

// Tests for OTLP Exporter
Deno.test("Telemetry - OTLPHttpExporter generates valid IDs", () => {
  const exporter = new OTLPHttpExporter({
    enabled: true,
    serviceName: "test-service",
  });

  // Generate trace and span IDs
  const traceId = exporter.generateTraceId();
  const spanId = exporter.generateSpanId();

  // Verify IDs have the correct format and length
  assertEquals(traceId.length, 32); // 16 bytes as hex
  assertEquals(spanId.length, 16); // 8 bytes as hex

  // Verify IDs are hex strings
  assertEquals(/^[0-9a-f]+$/.test(traceId), true);
  assertEquals(/^[0-9a-f]+$/.test(spanId), true);
});

Deno.test("Telemetry - OTLPHttpExporter handles empty exports gracefully", async () => {
  const exporter = new OTLPHttpExporter({
    enabled: true,
    serviceName: "test-service",
  });

  // Test exporting empty arrays
  await exporter.exportSpans([]);
  await exporter.exportMetrics([]);
  await exporter.exportLogs([]);

  // These should complete without error
});
