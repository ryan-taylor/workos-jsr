import { assertEquals } from "@std/assert";
/**
 * Tests for the Telemetry module
 * Covers:
 * - Instrumentation of WorkOS core methods
 * - Instrumentation of module methods (SSO, DirectorySync, etc.)
 * - Telemetry manager functionality
 * - OTLP exporter
 */ // Mock WorkOS instance for testing
class MockWorkOS {
  lastPath = null;
  lastMethod = null;
  lastData = null;
  mockResponseData;
  shouldThrow = false;
  constructor(mockResponse = {}, shouldThrow = false){
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }
  async get(path, options = {}) {
    this.lastPath = path;
    this.lastMethod = "get";
    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }
    return {
      data: this.mockResponseData
    };
  }
  async post(path, entity, options = {}) {
    this.lastPath = path;
    this.lastMethod = "post";
    this.lastData = entity;
    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }
    return {
      data: this.mockResponseData
    };
  }
  async put(path, entity, options = {}) {
    this.lastPath = path;
    this.lastMethod = "put";
    this.lastData = entity;
    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }
    return {
      data: this.mockResponseData
    };
  }
  async delete(path, query) {
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
      data: this.lastData
    };
  }
}
// Mock SSO class for testing instrumentation
class MockSSO {
  getAuthorizationUrl(options) {
    return "https://api.workos.com/sso/authorize?client_id=client_123&redirect_uri=https://example.com/callback";
  }
  async getProfile(options) {
    return {
      id: "profile_123",
      email: "user@example.com"
    };
  }
}
// Mock DirectorySync class for testing instrumentation
class MockDirectorySync {
  async listUsers(options = {}) {
    return {
      data: [
        {
          id: "user_1",
          email: "user1@example.com"
        },
        {
          id: "user_2",
          email: "user2@example.com"
        }
      ],
      list_metadata: {
        before: null,
        after: null
      }
    };
  }
}
// Mock UserManagement class for testing instrumentation
class MockUserManagement {
  async authenticateWithPassword(options) {
    return {
      user: {
        id: "user_123",
        email: options.email
      },
      access_token: "token_xyz"
    };
  }
}
// Mock implementation of the SpanStatus enum
var SpanStatus = /*#__PURE__*/ function(SpanStatus) {
  SpanStatus[SpanStatus["UNSET"] = 0] = "UNSET";
  SpanStatus[SpanStatus["OK"] = 1] = "OK";
  SpanStatus[SpanStatus["ERROR"] = 2] = "ERROR";
  return SpanStatus;
}(SpanStatus || {});
// Mock implementation of the TelemetryManager
class MockTelemetryManager {
  spans = new Map();
  metrics = [];
  logs = [];
  spansExported = 0;
  metricsExported = 0;
  logsExported = 0;
  startSpan(name, attributes = {}, parentSpanId) {
    const spanId = `span_${Math.random().toString(36).substring(2, 9)}`;
    this.spans.set(spanId, {
      name,
      attributes,
      startTime: Date.now()
    });
    return spanId;
  }
  endSpan(spanId, status = SpanStatus.OK, message, attributes = {}) {
    if (this.spans.has(spanId)) {
      const span = this.spans.get(spanId);
      this.spans.delete(spanId);
    // In a real implementation, this would add the span to a batch for export
    }
  }
  recordMetric(name, value, type = "counter", attributes = {}) {
    this.metrics.push({
      name,
      value,
      type,
      attributes
    });
  }
  recordLog(body, severity = 9, attributes = {}, spanId) {
    this.logs.push({
      body,
      severity,
      attributes,
      spanId
    });
  }
  async flush() {
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
      logsExported: this.logsExported
    };
  }
  // Helper to check if a specific span exists
  hasSpan(spanId) {
    return this.spans.has(spanId);
  }
  // Helper to get metrics count
  getMetricsCount() {
    return this.metrics.length;
  }
  // Helper to get logs count
  getLogsCount() {
    return this.logs.length;
  }
}
// Import the real telemetry module and mock it
import { telemetry } from "../src/telemetry/telemetry-manager.ts";
import { instrumentDirectorySync, instrumentSSO, instrumentUserManagement, instrumentWorkOSCore } from "../src/telemetry/instrumentation.ts";
import { OTLPHttpExporter } from "../src/telemetry/otlp-exporter.ts";
// Create a test instance of telemetry manager
const mockTelemetryManager = new MockTelemetryManager();
// Tests for WorkOS core instrumentation
Deno.test("Telemetry - instrumentWorkOSCore wraps HTTP methods correctly", async ()=>{
  const mockWorkos = new MockWorkOS({
    id: "123",
    name: "Test"
  });
  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes = {};
  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (name, attributes = {}, parentSpanId)=>{
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (spanId, status = SpanStatus.OK, message, attributes = {})=>{
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    }
  };
  // Replace global telemetry with our tracked mock
  const originalTelemetry = {
    ...telemetry
  };
  Object.assign(telemetry, trackedManager);
  try {
    // Instrument the WorkOS instance
    instrumentWorkOSCore(mockWorkos);
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
    await mockWorkos.post("/test/post", {
      key: "value"
    });
    const postRequest = mockWorkos.getLastRequest();
    assertEquals(postRequest.path, "/test/post");
    assertEquals(postRequest.method, "post");
    assertEquals(postRequest.data, {
      key: "value"
    });
    // Verify telemetry capture for POST
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastSpanName, "workos.post");
    // Reset counters
    startSpanCalls = 0;
    endSpanCalls = 0;
    // Test PUT method
    await mockWorkos.put("/test/put", {
      update: true
    });
    const putRequest = mockWorkos.getLastRequest();
    assertEquals(putRequest.path, "/test/put");
    assertEquals(putRequest.method, "put");
    assertEquals(putRequest.data, {
      update: true
    });
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
  } finally{
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});
Deno.test("Telemetry - instrumentWorkOSCore handles errors correctly", async ()=>{
  const mockWorkos = new MockWorkOS({}, true); // Will throw errors
  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let lastStatus = SpanStatus.UNSET;
  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (name, attributes = {}, parentSpanId)=>{
      startSpanCalls++;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (spanId, status = SpanStatus.OK, message, attributes = {})=>{
      endSpanCalls++;
      lastStatus = status;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    }
  };
  // Replace global telemetry with our tracked mock
  const originalTelemetry = {
    ...telemetry
  };
  Object.assign(telemetry, trackedManager);
  try {
    // Instrument the WorkOS instance
    instrumentWorkOSCore(mockWorkos);
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
      await mockWorkos.post("/test/post", {
        key: "value"
      });
    } catch (error) {
    // Expected error
    }
    // Verify telemetry captures the error
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(lastStatus, SpanStatus.ERROR);
  } finally{
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});
// Tests for SSO instrumentation
Deno.test("Telemetry - instrumentSSO wraps methods correctly", async ()=>{
  const mockSso = new MockSSO();
  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes = {};
  let lastMetricName = "";
  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (name, attributes = {}, parentSpanId)=>{
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (spanId, status = SpanStatus.OK, message, attributes = {})=>{
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (name, value, type = "counter", attributes = {})=>{
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    }
  };
  // Replace global telemetry with our tracked mock
  const originalTelemetry = {
    ...telemetry
  };
  Object.assign(telemetry, trackedManager);
  try {
    // Instrument the SSO instance
    instrumentSSO(mockSso);
    // Test getAuthorizationUrl method
    mockSso.getAuthorizationUrl({
      connection: "conn_123",
      organization: "org_123",
      domain: "example.com"
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
    await mockSso.getProfile({
      code: "code_123"
    });
    // Verify telemetry was captured with metrics
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(recordMetricCalls, 1);
    assertEquals(lastSpanName, "sso.getProfile");
    assertEquals(lastMetricName, "sso.profile_requests");
  } finally{
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});
// Tests for DirectorySync instrumentation
Deno.test("Telemetry - instrumentDirectorySync wraps methods correctly", async ()=>{
  const mockDirectorySync = new MockDirectorySync();
  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes = {};
  let lastMetricName = "";
  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (name, attributes = {}, parentSpanId)=>{
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (spanId, status = SpanStatus.OK, message, attributes = {})=>{
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (name, value, type = "counter", attributes = {})=>{
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    }
  };
  // Replace global telemetry with our tracked mock
  const originalTelemetry = {
    ...telemetry
  };
  Object.assign(telemetry, trackedManager);
  try {
    // Instrument the DirectorySync instance
    instrumentDirectorySync(mockDirectorySync);
    // Test listUsers method
    await mockDirectorySync.listUsers({
      directory: "dir_123"
    });
    // Verify telemetry was captured
    assertEquals(startSpanCalls, 1);
    assertEquals(endSpanCalls, 1);
    assertEquals(recordMetricCalls, 1);
    assertEquals(lastSpanName, "directorySync.listUsers");
    assertEquals(lastSpanAttributes["workos.module"], "directorySync");
    assertEquals(lastSpanAttributes["directorySync.directory"], "dir_123");
    assertEquals(lastMetricName, "directory_sync.user_queries");
  } finally{
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});
// Tests for UserManagement instrumentation
Deno.test("Telemetry - instrumentUserManagement wraps methods correctly", async ()=>{
  const mockUserManagement = new MockUserManagement();
  // Track telemetry method calls
  let startSpanCalls = 0;
  let endSpanCalls = 0;
  let recordMetricCalls = 0;
  let lastSpanName = "";
  let lastSpanAttributes = {};
  let lastMetricName = "";
  // Create a proxied telemetry manager to track calls
  const trackedManager = {
    ...mockTelemetryManager,
    startSpan: (name, attributes = {}, parentSpanId)=>{
      startSpanCalls++;
      lastSpanName = name;
      lastSpanAttributes = attributes;
      return mockTelemetryManager.startSpan(name, attributes, parentSpanId);
    },
    endSpan: (spanId, status = SpanStatus.OK, message, attributes = {})=>{
      endSpanCalls++;
      mockTelemetryManager.endSpan(spanId, status, message, attributes);
    },
    recordMetric: (name, value, type = "counter", attributes = {})=>{
      recordMetricCalls++;
      lastMetricName = name;
      mockTelemetryManager.recordMetric(name, value, type, attributes);
    }
  };
  // Replace global telemetry with our tracked mock
  const originalTelemetry = {
    ...telemetry
  };
  Object.assign(telemetry, trackedManager);
  try {
    // Instrument the UserManagement instance
    instrumentUserManagement(mockUserManagement);
    // Test authenticateWithPassword method
    await mockUserManagement.authenticateWithPassword({
      email: "user@example.com",
      password: "password123"
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
  } finally{
    // Restore original telemetry
    Object.assign(telemetry, originalTelemetry);
  }
});
// Tests for TelemetryManager functionality
Deno.test("Telemetry - TelemetryManager span lifecycle", ()=>{
  const manager = new MockTelemetryManager();
  // Start a span
  const spanId = manager.startSpan("test.operation", {
    "custom.attribute": "value"
  });
  // Verify span is active
  assertEquals(manager.hasSpan(spanId), true);
  // End the span
  manager.endSpan(spanId, SpanStatus.OK);
  // Verify span is no longer active
  assertEquals(manager.hasSpan(spanId), false);
});
Deno.test("Telemetry - TelemetryManager recordMetric", ()=>{
  const manager = new MockTelemetryManager();
  // Record a counter metric
  manager.recordMetric("test.counter", 1, "counter", {
    "custom.attribute": "value"
  });
  // Verify metric was recorded
  assertEquals(manager.getMetricsCount(), 1);
  // Record a gauge metric
  manager.recordMetric("test.gauge", 42.5, "gauge", {
    "custom.attribute": "value"
  });
  // Verify another metric was recorded
  assertEquals(manager.getMetricsCount(), 2);
});
Deno.test("Telemetry - TelemetryManager recordLog", ()=>{
  const manager = new MockTelemetryManager();
  // Record a log
  manager.recordLog("Test log message", 9, {
    "custom.attribute": "value"
  });
  // Verify log was recorded
  assertEquals(manager.getLogsCount(), 1);
  // Record another log with different severity
  manager.recordLog("Error log message", 17, {
    "error": true
  });
  // Verify another log was recorded
  assertEquals(manager.getLogsCount(), 2);
});
Deno.test("Telemetry - TelemetryManager flush", async ()=>{
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
Deno.test("Telemetry - OTLPHttpExporter generates valid IDs", ()=>{
  const exporter = new OTLPHttpExporter({
    enabled: true,
    serviceName: "test-service"
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
Deno.test("Telemetry - OTLPHttpExporter handles empty exports gracefully", async ()=>{
  const exporter = new OTLPHttpExporter({
    enabled: true,
    serviceName: "test-service"
  });
  // Test exporting empty arrays
  await exporter.exportSpans([]);
  await exporter.exportMetrics([]);
  await exporter.exportLogs([]);
// These should complete without error
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvdGVzdHNfZGVuby90ZWxlbWV0cnkuc3BlYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhc3NlcnRFcXVhbHMsIGFzc2VydEV4aXN0cywgYXNzZXJ0Tm90RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG5cbi8qKlxuICogVGVzdHMgZm9yIHRoZSBUZWxlbWV0cnkgbW9kdWxlXG4gKiBDb3ZlcnM6XG4gKiAtIEluc3RydW1lbnRhdGlvbiBvZiBXb3JrT1MgY29yZSBtZXRob2RzXG4gKiAtIEluc3RydW1lbnRhdGlvbiBvZiBtb2R1bGUgbWV0aG9kcyAoU1NPLCBEaXJlY3RvcnlTeW5jLCBldGMuKVxuICogLSBUZWxlbWV0cnkgbWFuYWdlciBmdW5jdGlvbmFsaXR5XG4gKiAtIE9UTFAgZXhwb3J0ZXJcbiAqL1xuXG4vLyBNb2NrIFdvcmtPUyBpbnN0YW5jZSBmb3IgdGVzdGluZ1xuY2xhc3MgTW9ja1dvcmtPUyB7XG4gIHByaXZhdGUgbGFzdFBhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxhc3RNZXRob2Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxhc3REYXRhOiB1bmtub3duID0gbnVsbDtcbiAgcHJpdmF0ZSBtb2NrUmVzcG9uc2VEYXRhOiB1bmtub3duO1xuICBwcml2YXRlIHNob3VsZFRocm93ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IobW9ja1Jlc3BvbnNlOiB1bmtub3duID0ge30sIHNob3VsZFRocm93ID0gZmFsc2UpIHtcbiAgICB0aGlzLm1vY2tSZXNwb25zZURhdGEgPSBtb2NrUmVzcG9uc2U7XG4gICAgdGhpcy5zaG91bGRUaHJvdyA9IHNob3VsZFRocm93O1xuICB9XG5cbiAgYXN5bmMgZ2V0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucyA9IHt9KTogUHJvbWlzZTx7IGRhdGE6IFQgfT4ge1xuICAgIHRoaXMubGFzdFBhdGggPSBwYXRoO1xuICAgIHRoaXMubGFzdE1ldGhvZCA9IFwiZ2V0XCI7XG5cbiAgICBpZiAodGhpcy5zaG91bGRUaHJvdykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9jayBBUEkgZXJyb3JcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZGF0YTogdGhpcy5tb2NrUmVzcG9uc2VEYXRhIGFzIFQgfTtcbiAgfVxuXG4gIGFzeW5jIHBvc3Q8VD4oXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGVudGl0eT86IHVua25vd24sXG4gICAgb3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHsgZGF0YTogVCB9PiB7XG4gICAgdGhpcy5sYXN0UGF0aCA9IHBhdGg7XG4gICAgdGhpcy5sYXN0TWV0aG9kID0gXCJwb3N0XCI7XG4gICAgdGhpcy5sYXN0RGF0YSA9IGVudGl0eTtcblxuICAgIGlmICh0aGlzLnNob3VsZFRocm93KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2NrIEFQSSBlcnJvclwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBkYXRhOiB0aGlzLm1vY2tSZXNwb25zZURhdGEgYXMgVCB9O1xuICB9XG5cbiAgYXN5bmMgcHV0PFQ+KFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBlbnRpdHk/OiB1bmtub3duLFxuICAgIG9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTx7IGRhdGE6IFQgfT4ge1xuICAgIHRoaXMubGFzdFBhdGggPSBwYXRoO1xuICAgIHRoaXMubGFzdE1ldGhvZCA9IFwicHV0XCI7XG4gICAgdGhpcy5sYXN0RGF0YSA9IGVudGl0eTtcblxuICAgIGlmICh0aGlzLnNob3VsZFRocm93KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2NrIEFQSSBlcnJvclwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBkYXRhOiB0aGlzLm1vY2tSZXNwb25zZURhdGEgYXMgVCB9O1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKHBhdGg6IHN0cmluZywgcXVlcnk/OiB1bmtub3duKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5sYXN0UGF0aCA9IHBhdGg7XG4gICAgdGhpcy5sYXN0TWV0aG9kID0gXCJkZWxldGVcIjtcbiAgICB0aGlzLmxhc3REYXRhID0gcXVlcnk7XG5cbiAgICBpZiAodGhpcy5zaG91bGRUaHJvdykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTW9jayBBUEkgZXJyb3JcIik7XG4gICAgfVxuICB9XG5cbiAgZ2V0TGFzdFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IHRoaXMubGFzdFBhdGgsXG4gICAgICBtZXRob2Q6IHRoaXMubGFzdE1ldGhvZCxcbiAgICAgIGRhdGE6IHRoaXMubGFzdERhdGEsXG4gICAgfTtcbiAgfVxufVxuXG4vLyBNb2NrIFNTTyBjbGFzcyBmb3IgdGVzdGluZyBpbnN0cnVtZW50YXRpb25cbmNsYXNzIE1vY2tTU08ge1xuICBnZXRBdXRob3JpemF0aW9uVXJsKFxuICAgIG9wdGlvbnM6IHsgY29ubmVjdGlvbj86IHN0cmluZzsgb3JnYW5pemF0aW9uPzogc3RyaW5nOyBkb21haW4/OiBzdHJpbmcgfSxcbiAgKSB7XG4gICAgcmV0dXJuIFwiaHR0cHM6Ly9hcGkud29ya29zLmNvbS9zc28vYXV0aG9yaXplP2NsaWVudF9pZD1jbGllbnRfMTIzJnJlZGlyZWN0X3VyaT1odHRwczovL2V4YW1wbGUuY29tL2NhbGxiYWNrXCI7XG4gIH1cblxuICBhc3luYyBnZXRQcm9maWxlKG9wdGlvbnM6IHsgY29kZTogc3RyaW5nIH0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IFwicHJvZmlsZV8xMjNcIixcbiAgICAgIGVtYWlsOiBcInVzZXJAZXhhbXBsZS5jb21cIixcbiAgICB9O1xuICB9XG59XG5cbi8vIE1vY2sgRGlyZWN0b3J5U3luYyBjbGFzcyBmb3IgdGVzdGluZyBpbnN0cnVtZW50YXRpb25cbmNsYXNzIE1vY2tEaXJlY3RvcnlTeW5jIHtcbiAgYXN5bmMgbGlzdFVzZXJzKG9wdGlvbnM6IHsgZGlyZWN0b3J5Pzogc3RyaW5nIH0gPSB7fSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhOiBbXG4gICAgICAgIHsgaWQ6IFwidXNlcl8xXCIsIGVtYWlsOiBcInVzZXIxQGV4YW1wbGUuY29tXCIgfSxcbiAgICAgICAgeyBpZDogXCJ1c2VyXzJcIiwgZW1haWw6IFwidXNlcjJAZXhhbXBsZS5jb21cIiB9LFxuICAgICAgXSxcbiAgICAgIGxpc3RfbWV0YWRhdGE6IHtcbiAgICAgICAgYmVmb3JlOiBudWxsLFxuICAgICAgICBhZnRlcjogbnVsbCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuXG4vLyBNb2NrIFVzZXJNYW5hZ2VtZW50IGNsYXNzIGZvciB0ZXN0aW5nIGluc3RydW1lbnRhdGlvblxuY2xhc3MgTW9ja1VzZXJNYW5hZ2VtZW50IHtcbiAgYXN5bmMgYXV0aGVudGljYXRlV2l0aFBhc3N3b3JkKG9wdGlvbnM6IHsgZW1haWw6IHN0cmluZzsgcGFzc3dvcmQ6IHN0cmluZyB9KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgaWQ6IFwidXNlcl8xMjNcIixcbiAgICAgICAgZW1haWw6IG9wdGlvbnMuZW1haWwsXG4gICAgICB9LFxuICAgICAgYWNjZXNzX3Rva2VuOiBcInRva2VuX3h5elwiLFxuICAgIH07XG4gIH1cbn1cblxuLy8gTW9jayBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgU3BhblN0YXR1cyBlbnVtXG5lbnVtIFNwYW5TdGF0dXMge1xuICBVTlNFVCA9IDAsXG4gIE9LID0gMSxcbiAgRVJST1IgPSAyLFxufVxuXG4vLyBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHRoZSBUZWxlbWV0cnlNYW5hZ2VyXG5jbGFzcyBNb2NrVGVsZW1ldHJ5TWFuYWdlciB7XG4gIHByaXZhdGUgc3BhbnM6IE1hcDxzdHJpbmcsIHVua25vd24+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIG1ldHJpY3M6IHVua25vd25bXSA9IFtdO1xuICBwcml2YXRlIGxvZ3M6IHVua25vd25bXSA9IFtdO1xuICBwcml2YXRlIHNwYW5zRXhwb3J0ZWQgPSAwO1xuICBwcml2YXRlIG1ldHJpY3NFeHBvcnRlZCA9IDA7XG4gIHByaXZhdGUgbG9nc0V4cG9ydGVkID0gMDtcblxuICBzdGFydFNwYW4obmFtZTogc3RyaW5nLCBhdHRyaWJ1dGVzID0ge30sIHBhcmVudFNwYW5JZD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3BhbklkID0gYHNwYW5fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgOSl9YDtcbiAgICB0aGlzLnNwYW5zLnNldChzcGFuSWQsIHsgbmFtZSwgYXR0cmlidXRlcywgc3RhcnRUaW1lOiBEYXRlLm5vdygpIH0pO1xuICAgIHJldHVybiBzcGFuSWQ7XG4gIH1cblxuICBlbmRTcGFuKFxuICAgIHNwYW5JZDogc3RyaW5nLFxuICAgIHN0YXR1cyA9IFNwYW5TdGF0dXMuT0ssXG4gICAgbWVzc2FnZT86IHN0cmluZyxcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNwYW5zLmhhcyhzcGFuSWQpKSB7XG4gICAgICBjb25zdCBzcGFuID0gdGhpcy5zcGFucy5nZXQoc3BhbklkKTtcbiAgICAgIHRoaXMuc3BhbnMuZGVsZXRlKHNwYW5JZCk7XG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgYWRkIHRoZSBzcGFuIHRvIGEgYmF0Y2ggZm9yIGV4cG9ydFxuICAgIH1cbiAgfVxuXG4gIHJlY29yZE1ldHJpYyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IG51bWJlciB8IHtcbiAgICAgIGNvdW50OiBudW1iZXI7XG4gICAgICBzdW06IG51bWJlcjtcbiAgICAgIGJ1Y2tldHM6IHsgY291bnQ6IG51bWJlcjsgdXBwZXJCb3VuZDogbnVtYmVyIH1bXTtcbiAgICB9LFxuICAgIHR5cGUgPSBcImNvdW50ZXJcIixcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICk6IHZvaWQge1xuICAgIHRoaXMubWV0cmljcy5wdXNoKHsgbmFtZSwgdmFsdWUsIHR5cGUsIGF0dHJpYnV0ZXMgfSk7XG4gIH1cblxuICByZWNvcmRMb2coXG4gICAgYm9keTogc3RyaW5nLFxuICAgIHNldmVyaXR5ID0gOSxcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgc3BhbklkPzogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICB0aGlzLmxvZ3MucHVzaCh7IGJvZHksIHNldmVyaXR5LCBhdHRyaWJ1dGVzLCBzcGFuSWQgfSk7XG4gIH1cblxuICBhc3luYyBmbHVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNwYW5zRXhwb3J0ZWQgKz0gdGhpcy5zcGFucy5zaXplO1xuICAgIHRoaXMuc3BhbnMuY2xlYXIoKTtcbiAgICB0aGlzLm1ldHJpY3NFeHBvcnRlZCArPSB0aGlzLm1ldHJpY3MubGVuZ3RoO1xuICAgIHRoaXMubWV0cmljcyA9IFtdO1xuICAgIHRoaXMubG9nc0V4cG9ydGVkICs9IHRoaXMubG9ncy5sZW5ndGg7XG4gICAgdGhpcy5sb2dzID0gW107XG4gIH1cblxuICBnZXRFeHBvcnRTdGF0cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhbnNFeHBvcnRlZDogdGhpcy5zcGFuc0V4cG9ydGVkLFxuICAgICAgbWV0cmljc0V4cG9ydGVkOiB0aGlzLm1ldHJpY3NFeHBvcnRlZCxcbiAgICAgIGxvZ3NFeHBvcnRlZDogdGhpcy5sb2dzRXhwb3J0ZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8vIEhlbHBlciB0byBjaGVjayBpZiBhIHNwZWNpZmljIHNwYW4gZXhpc3RzXG4gIGhhc1NwYW4oc3BhbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zcGFucy5oYXMoc3BhbklkKTtcbiAgfVxuXG4gIC8vIEhlbHBlciB0byBnZXQgbWV0cmljcyBjb3VudFxuICBnZXRNZXRyaWNzQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5tZXRyaWNzLmxlbmd0aDtcbiAgfVxuXG4gIC8vIEhlbHBlciB0byBnZXQgbG9ncyBjb3VudFxuICBnZXRMb2dzQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sb2dzLmxlbmd0aDtcbiAgfVxufVxuXG4vLyBJbXBvcnQgdGhlIHJlYWwgdGVsZW1ldHJ5IG1vZHVsZSBhbmQgbW9jayBpdFxuaW1wb3J0IHsgdGVsZW1ldHJ5IH0gZnJvbSBcIi4uL3NyYy90ZWxlbWV0cnkvdGVsZW1ldHJ5LW1hbmFnZXIudHNcIjtcbmltcG9ydCB7XG4gIGluc3RydW1lbnREaXJlY3RvcnlTeW5jLFxuICBpbnN0cnVtZW50U1NPLFxuICBpbnN0cnVtZW50VXNlck1hbmFnZW1lbnQsXG4gIGluc3RydW1lbnRXb3JrT1NDb3JlLFxufSBmcm9tIFwiLi4vc3JjL3RlbGVtZXRyeS9pbnN0cnVtZW50YXRpb24udHNcIjtcbmltcG9ydCB7IE9UTFBIdHRwRXhwb3J0ZXIgfSBmcm9tIFwiLi4vc3JjL3RlbGVtZXRyeS9vdGxwLWV4cG9ydGVyLnRzXCI7XG5cbi8vIENyZWF0ZSBhIHRlc3QgaW5zdGFuY2Ugb2YgdGVsZW1ldHJ5IG1hbmFnZXJcbmNvbnN0IG1vY2tUZWxlbWV0cnlNYW5hZ2VyID0gbmV3IE1vY2tUZWxlbWV0cnlNYW5hZ2VyKCk7XG5cbi8vIFRlc3RzIGZvciBXb3JrT1MgY29yZSBpbnN0cnVtZW50YXRpb25cbkRlbm8udGVzdChcIlRlbGVtZXRyeSAtIGluc3RydW1lbnRXb3JrT1NDb3JlIHdyYXBzIEhUVFAgbWV0aG9kcyBjb3JyZWN0bHlcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBtb2NrV29ya29zID0gbmV3IE1vY2tXb3JrT1MoeyBpZDogXCIxMjNcIiwgbmFtZTogXCJUZXN0XCIgfSk7XG5cbiAgLy8gVHJhY2sgdGVsZW1ldHJ5IG1ldGhvZCBjYWxsc1xuICBsZXQgc3RhcnRTcGFuQ2FsbHMgPSAwO1xuICBsZXQgZW5kU3BhbkNhbGxzID0gMDtcbiAgbGV0IGxhc3RTcGFuTmFtZSA9IFwiXCI7XG4gIGxldCBsYXN0U3BhbkF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG5cbiAgLy8gQ3JlYXRlIGEgcHJveGllZCB0ZWxlbWV0cnkgbWFuYWdlciB0byB0cmFjayBjYWxsc1xuICBjb25zdCB0cmFja2VkTWFuYWdlciA9IHtcbiAgICAuLi5tb2NrVGVsZW1ldHJ5TWFuYWdlcixcbiAgICBzdGFydFNwYW46IChcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICAgIHBhcmVudFNwYW5JZD86IHN0cmluZyxcbiAgICApOiBzdHJpbmcgPT4ge1xuICAgICAgc3RhcnRTcGFuQ2FsbHMrKztcbiAgICAgIGxhc3RTcGFuTmFtZSA9IG5hbWU7XG4gICAgICBsYXN0U3BhbkF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgICAgcmV0dXJuIG1vY2tUZWxlbWV0cnlNYW5hZ2VyLnN0YXJ0U3BhbihuYW1lLCBhdHRyaWJ1dGVzLCBwYXJlbnRTcGFuSWQpO1xuICAgIH0sXG4gICAgZW5kU3BhbjogKFxuICAgICAgc3BhbklkOiBzdHJpbmcsXG4gICAgICBzdGF0dXMgPSBTcGFuU3RhdHVzLk9LLFxuICAgICAgbWVzc2FnZT86IHN0cmluZyxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICApOiB2b2lkID0+IHtcbiAgICAgIGVuZFNwYW5DYWxscysrO1xuICAgICAgbW9ja1RlbGVtZXRyeU1hbmFnZXIuZW5kU3BhbihzcGFuSWQsIHN0YXR1cywgbWVzc2FnZSwgYXR0cmlidXRlcyk7XG4gICAgfSxcbiAgfTtcblxuICAvLyBSZXBsYWNlIGdsb2JhbCB0ZWxlbWV0cnkgd2l0aCBvdXIgdHJhY2tlZCBtb2NrXG4gIGNvbnN0IG9yaWdpbmFsVGVsZW1ldHJ5ID0geyAuLi50ZWxlbWV0cnkgfTtcbiAgT2JqZWN0LmFzc2lnbih0ZWxlbWV0cnksIHRyYWNrZWRNYW5hZ2VyKTtcblxuICB0cnkge1xuICAgIC8vIEluc3RydW1lbnQgdGhlIFdvcmtPUyBpbnN0YW5jZVxuICAgIGluc3RydW1lbnRXb3JrT1NDb3JlKG1vY2tXb3Jrb3MgYXMgYW55KTtcblxuICAgIC8vIFRlc3QgR0VUIG1ldGhvZFxuICAgIGF3YWl0IG1vY2tXb3Jrb3MuZ2V0KFwiL3Rlc3QvcGF0aFwiKTtcblxuICAgIC8vIFZlcmlmeSBjb3JyZWN0IEFQSSBjYWxsIHdhcyBtYWRlXG4gICAgY29uc3QgbGFzdFJlcXVlc3QgPSBtb2NrV29ya29zLmdldExhc3RSZXF1ZXN0KCk7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RSZXF1ZXN0LnBhdGgsIFwiL3Rlc3QvcGF0aFwiKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFJlcXVlc3QubWV0aG9kLCBcImdldFwiKTtcblxuICAgIC8vIFZlcmlmeSB0ZWxlbWV0cnkgd2FzIGNhcHR1cmVkXG4gICAgYXNzZXJ0RXF1YWxzKHN0YXJ0U3BhbkNhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMoZW5kU3BhbkNhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5OYW1lLCBcIndvcmtvcy5nZXRcIik7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RTcGFuQXR0cmlidXRlc1tcImh0dHAubWV0aG9kXCJdLCBcIkdFVFwiKTtcblxuICAgIC8vIFJlc2V0IGNvdW50ZXJzXG4gICAgc3RhcnRTcGFuQ2FsbHMgPSAwO1xuICAgIGVuZFNwYW5DYWxscyA9IDA7XG5cbiAgICAvLyBUZXN0IFBPU1QgbWV0aG9kXG4gICAgYXdhaXQgbW9ja1dvcmtvcy5wb3N0KFwiL3Rlc3QvcG9zdFwiLCB7IGtleTogXCJ2YWx1ZVwiIH0pO1xuXG4gICAgY29uc3QgcG9zdFJlcXVlc3QgPSBtb2NrV29ya29zLmdldExhc3RSZXF1ZXN0KCk7XG4gICAgYXNzZXJ0RXF1YWxzKHBvc3RSZXF1ZXN0LnBhdGgsIFwiL3Rlc3QvcG9zdFwiKTtcbiAgICBhc3NlcnRFcXVhbHMocG9zdFJlcXVlc3QubWV0aG9kLCBcInBvc3RcIik7XG4gICAgYXNzZXJ0RXF1YWxzKHBvc3RSZXF1ZXN0LmRhdGEsIHsga2V5OiBcInZhbHVlXCIgfSk7XG5cbiAgICAvLyBWZXJpZnkgdGVsZW1ldHJ5IGNhcHR1cmUgZm9yIFBPU1RcbiAgICBhc3NlcnRFcXVhbHMoc3RhcnRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhlbmRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3Bhbk5hbWUsIFwid29ya29zLnBvc3RcIik7XG5cbiAgICAvLyBSZXNldCBjb3VudGVyc1xuICAgIHN0YXJ0U3BhbkNhbGxzID0gMDtcbiAgICBlbmRTcGFuQ2FsbHMgPSAwO1xuXG4gICAgLy8gVGVzdCBQVVQgbWV0aG9kXG4gICAgYXdhaXQgbW9ja1dvcmtvcy5wdXQoXCIvdGVzdC9wdXRcIiwgeyB1cGRhdGU6IHRydWUgfSk7XG5cbiAgICBjb25zdCBwdXRSZXF1ZXN0ID0gbW9ja1dvcmtvcy5nZXRMYXN0UmVxdWVzdCgpO1xuICAgIGFzc2VydEVxdWFscyhwdXRSZXF1ZXN0LnBhdGgsIFwiL3Rlc3QvcHV0XCIpO1xuICAgIGFzc2VydEVxdWFscyhwdXRSZXF1ZXN0Lm1ldGhvZCwgXCJwdXRcIik7XG4gICAgYXNzZXJ0RXF1YWxzKHB1dFJlcXVlc3QuZGF0YSwgeyB1cGRhdGU6IHRydWUgfSk7XG5cbiAgICAvLyBWZXJpZnkgdGVsZW1ldHJ5IGNhcHR1cmUgZm9yIFBVVFxuICAgIGFzc2VydEVxdWFscyhzdGFydFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKGVuZFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RTcGFuTmFtZSwgXCJ3b3Jrb3MucHV0XCIpO1xuXG4gICAgLy8gUmVzZXQgY291bnRlcnNcbiAgICBzdGFydFNwYW5DYWxscyA9IDA7XG4gICAgZW5kU3BhbkNhbGxzID0gMDtcblxuICAgIC8vIFRlc3QgREVMRVRFIG1ldGhvZFxuICAgIGF3YWl0IG1vY2tXb3Jrb3MuZGVsZXRlKFwiL3Rlc3QvZGVsZXRlXCIpO1xuXG4gICAgY29uc3QgZGVsZXRlUmVxdWVzdCA9IG1vY2tXb3Jrb3MuZ2V0TGFzdFJlcXVlc3QoKTtcbiAgICBhc3NlcnRFcXVhbHMoZGVsZXRlUmVxdWVzdC5wYXRoLCBcIi90ZXN0L2RlbGV0ZVwiKTtcbiAgICBhc3NlcnRFcXVhbHMoZGVsZXRlUmVxdWVzdC5tZXRob2QsIFwiZGVsZXRlXCIpO1xuXG4gICAgLy8gVmVyaWZ5IHRlbGVtZXRyeSBjYXB0dXJlIGZvciBERUxFVEVcbiAgICBhc3NlcnRFcXVhbHMoc3RhcnRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhlbmRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3Bhbk5hbWUsIFwid29ya29zLmRlbGV0ZVwiKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZXN0b3JlIG9yaWdpbmFsIHRlbGVtZXRyeVxuICAgIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCBvcmlnaW5hbFRlbGVtZXRyeSk7XG4gIH1cbn0pO1xuXG5EZW5vLnRlc3QoXCJUZWxlbWV0cnkgLSBpbnN0cnVtZW50V29ya09TQ29yZSBoYW5kbGVzIGVycm9ycyBjb3JyZWN0bHlcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBtb2NrV29ya29zID0gbmV3IE1vY2tXb3JrT1Moe30sIHRydWUpOyAvLyBXaWxsIHRocm93IGVycm9yc1xuXG4gIC8vIFRyYWNrIHRlbGVtZXRyeSBtZXRob2QgY2FsbHNcbiAgbGV0IHN0YXJ0U3BhbkNhbGxzID0gMDtcbiAgbGV0IGVuZFNwYW5DYWxscyA9IDA7XG4gIGxldCBsYXN0U3RhdHVzID0gU3BhblN0YXR1cy5VTlNFVDtcblxuICAvLyBDcmVhdGUgYSBwcm94aWVkIHRlbGVtZXRyeSBtYW5hZ2VyIHRvIHRyYWNrIGNhbGxzXG4gIGNvbnN0IHRyYWNrZWRNYW5hZ2VyID0ge1xuICAgIC4uLm1vY2tUZWxlbWV0cnlNYW5hZ2VyLFxuICAgIHN0YXJ0U3BhbjogKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgYXR0cmlidXRlcyA9IHt9LFxuICAgICAgcGFyZW50U3BhbklkPzogc3RyaW5nLFxuICAgICk6IHN0cmluZyA9PiB7XG4gICAgICBzdGFydFNwYW5DYWxscysrO1xuICAgICAgcmV0dXJuIG1vY2tUZWxlbWV0cnlNYW5hZ2VyLnN0YXJ0U3BhbihuYW1lLCBhdHRyaWJ1dGVzLCBwYXJlbnRTcGFuSWQpO1xuICAgIH0sXG4gICAgZW5kU3BhbjogKFxuICAgICAgc3BhbklkOiBzdHJpbmcsXG4gICAgICBzdGF0dXMgPSBTcGFuU3RhdHVzLk9LLFxuICAgICAgbWVzc2FnZT86IHN0cmluZyxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICApOiB2b2lkID0+IHtcbiAgICAgIGVuZFNwYW5DYWxscysrO1xuICAgICAgbGFzdFN0YXR1cyA9IHN0YXR1cztcbiAgICAgIG1vY2tUZWxlbWV0cnlNYW5hZ2VyLmVuZFNwYW4oc3BhbklkLCBzdGF0dXMsIG1lc3NhZ2UsIGF0dHJpYnV0ZXMpO1xuICAgIH0sXG4gIH07XG5cbiAgLy8gUmVwbGFjZSBnbG9iYWwgdGVsZW1ldHJ5IHdpdGggb3VyIHRyYWNrZWQgbW9ja1xuICBjb25zdCBvcmlnaW5hbFRlbGVtZXRyeSA9IHsgLi4udGVsZW1ldHJ5IH07XG4gIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCB0cmFja2VkTWFuYWdlcik7XG5cbiAgdHJ5IHtcbiAgICAvLyBJbnN0cnVtZW50IHRoZSBXb3JrT1MgaW5zdGFuY2VcbiAgICBpbnN0cnVtZW50V29ya09TQ29yZShtb2NrV29ya29zIGFzIGFueSk7XG5cbiAgICAvLyBUZXN0IEdFVCBtZXRob2Qgd2l0aCBlcnJvclxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBtb2NrV29ya29zLmdldChcIi90ZXN0L3BhdGhcIik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIEV4cGVjdGVkIGVycm9yXG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IHRlbGVtZXRyeSB3YXMgY2FwdHVyZWQgd2l0aCBlcnJvciBzdGF0dXNcbiAgICBhc3NlcnRFcXVhbHMoc3RhcnRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhlbmRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3RhdHVzLCBTcGFuU3RhdHVzLkVSUk9SKTtcblxuICAgIC8vIFJlc2V0IGNvdW50ZXJzXG4gICAgc3RhcnRTcGFuQ2FsbHMgPSAwO1xuICAgIGVuZFNwYW5DYWxscyA9IDA7XG4gICAgbGFzdFN0YXR1cyA9IFNwYW5TdGF0dXMuVU5TRVQ7XG5cbiAgICAvLyBUZXN0IFBPU1QgbWV0aG9kIHdpdGggZXJyb3JcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbW9ja1dvcmtvcy5wb3N0KFwiL3Rlc3QvcG9zdFwiLCB7IGtleTogXCJ2YWx1ZVwiIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBFeHBlY3RlZCBlcnJvclxuICAgIH1cblxuICAgIC8vIFZlcmlmeSB0ZWxlbWV0cnkgY2FwdHVyZXMgdGhlIGVycm9yXG4gICAgYXNzZXJ0RXF1YWxzKHN0YXJ0U3BhbkNhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMoZW5kU3BhbkNhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFN0YXR1cywgU3BhblN0YXR1cy5FUlJPUik7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gUmVzdG9yZSBvcmlnaW5hbCB0ZWxlbWV0cnlcbiAgICBPYmplY3QuYXNzaWduKHRlbGVtZXRyeSwgb3JpZ2luYWxUZWxlbWV0cnkpO1xuICB9XG59KTtcblxuLy8gVGVzdHMgZm9yIFNTTyBpbnN0cnVtZW50YXRpb25cbkRlbm8udGVzdChcIlRlbGVtZXRyeSAtIGluc3RydW1lbnRTU08gd3JhcHMgbWV0aG9kcyBjb3JyZWN0bHlcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBtb2NrU3NvID0gbmV3IE1vY2tTU08oKTtcblxuICAvLyBUcmFjayB0ZWxlbWV0cnkgbWV0aG9kIGNhbGxzXG4gIGxldCBzdGFydFNwYW5DYWxscyA9IDA7XG4gIGxldCBlbmRTcGFuQ2FsbHMgPSAwO1xuICBsZXQgcmVjb3JkTWV0cmljQ2FsbHMgPSAwO1xuICBsZXQgbGFzdFNwYW5OYW1lID0gXCJcIjtcbiAgbGV0IGxhc3RTcGFuQXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgbGV0IGxhc3RNZXRyaWNOYW1lID0gXCJcIjtcblxuICAvLyBDcmVhdGUgYSBwcm94aWVkIHRlbGVtZXRyeSBtYW5hZ2VyIHRvIHRyYWNrIGNhbGxzXG4gIGNvbnN0IHRyYWNrZWRNYW5hZ2VyID0ge1xuICAgIC4uLm1vY2tUZWxlbWV0cnlNYW5hZ2VyLFxuICAgIHN0YXJ0U3BhbjogKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgYXR0cmlidXRlcyA9IHt9LFxuICAgICAgcGFyZW50U3BhbklkPzogc3RyaW5nLFxuICAgICk6IHN0cmluZyA9PiB7XG4gICAgICBzdGFydFNwYW5DYWxscysrO1xuICAgICAgbGFzdFNwYW5OYW1lID0gbmFtZTtcbiAgICAgIGxhc3RTcGFuQXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gICAgICByZXR1cm4gbW9ja1RlbGVtZXRyeU1hbmFnZXIuc3RhcnRTcGFuKG5hbWUsIGF0dHJpYnV0ZXMsIHBhcmVudFNwYW5JZCk7XG4gICAgfSxcbiAgICBlbmRTcGFuOiAoXG4gICAgICBzcGFuSWQ6IHN0cmluZyxcbiAgICAgIHN0YXR1cyA9IFNwYW5TdGF0dXMuT0ssXG4gICAgICBtZXNzYWdlPzogc3RyaW5nLFxuICAgICAgYXR0cmlidXRlcyA9IHt9LFxuICAgICk6IHZvaWQgPT4ge1xuICAgICAgZW5kU3BhbkNhbGxzKys7XG4gICAgICBtb2NrVGVsZW1ldHJ5TWFuYWdlci5lbmRTcGFuKHNwYW5JZCwgc3RhdHVzLCBtZXNzYWdlLCBhdHRyaWJ1dGVzKTtcbiAgICB9LFxuICAgIHJlY29yZE1ldHJpYzogKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgdmFsdWU6IGFueSxcbiAgICAgIHR5cGUgPSBcImNvdW50ZXJcIixcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICApID0+IHtcbiAgICAgIHJlY29yZE1ldHJpY0NhbGxzKys7XG4gICAgICBsYXN0TWV0cmljTmFtZSA9IG5hbWU7XG4gICAgICBtb2NrVGVsZW1ldHJ5TWFuYWdlci5yZWNvcmRNZXRyaWMobmFtZSwgdmFsdWUsIHR5cGUsIGF0dHJpYnV0ZXMpO1xuICAgIH0sXG4gIH07XG5cbiAgLy8gUmVwbGFjZSBnbG9iYWwgdGVsZW1ldHJ5IHdpdGggb3VyIHRyYWNrZWQgbW9ja1xuICBjb25zdCBvcmlnaW5hbFRlbGVtZXRyeSA9IHsgLi4udGVsZW1ldHJ5IH07XG4gIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCB0cmFja2VkTWFuYWdlcik7XG5cbiAgdHJ5IHtcbiAgICAvLyBJbnN0cnVtZW50IHRoZSBTU08gaW5zdGFuY2VcbiAgICBpbnN0cnVtZW50U1NPKG1vY2tTc28gYXMgYW55KTtcblxuICAgIC8vIFRlc3QgZ2V0QXV0aG9yaXphdGlvblVybCBtZXRob2RcbiAgICBtb2NrU3NvLmdldEF1dGhvcml6YXRpb25Vcmwoe1xuICAgICAgY29ubmVjdGlvbjogXCJjb25uXzEyM1wiLFxuICAgICAgb3JnYW5pemF0aW9uOiBcIm9yZ18xMjNcIixcbiAgICAgIGRvbWFpbjogXCJleGFtcGxlLmNvbVwiLFxuICAgIH0pO1xuXG4gICAgLy8gVmVyaWZ5IHRlbGVtZXRyeSB3YXMgY2FwdHVyZWRcbiAgICBhc3NlcnRFcXVhbHMoc3RhcnRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhlbmRTcGFuQ2FsbHMsIDEpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3Bhbk5hbWUsIFwic3NvLmdldEF1dGhvcml6YXRpb25VcmxcIik7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RTcGFuQXR0cmlidXRlc1tcIndvcmtvcy5tb2R1bGVcIl0sIFwic3NvXCIpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3BhbkF0dHJpYnV0ZXNbXCJzc28uY29ubmVjdGlvblwiXSwgXCJjb25uXzEyM1wiKTtcblxuICAgIC8vIFJlc2V0IGNvdW50ZXJzXG4gICAgc3RhcnRTcGFuQ2FsbHMgPSAwO1xuICAgIGVuZFNwYW5DYWxscyA9IDA7XG4gICAgcmVjb3JkTWV0cmljQ2FsbHMgPSAwO1xuXG4gICAgLy8gVGVzdCBnZXRQcm9maWxlIG1ldGhvZFxuICAgIGF3YWl0IG1vY2tTc28uZ2V0UHJvZmlsZSh7IGNvZGU6IFwiY29kZV8xMjNcIiB9KTtcblxuICAgIC8vIFZlcmlmeSB0ZWxlbWV0cnkgd2FzIGNhcHR1cmVkIHdpdGggbWV0cmljc1xuICAgIGFzc2VydEVxdWFscyhzdGFydFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKGVuZFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKHJlY29yZE1ldHJpY0NhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5OYW1lLCBcInNzby5nZXRQcm9maWxlXCIpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0TWV0cmljTmFtZSwgXCJzc28ucHJvZmlsZV9yZXF1ZXN0c1wiKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZXN0b3JlIG9yaWdpbmFsIHRlbGVtZXRyeVxuICAgIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCBvcmlnaW5hbFRlbGVtZXRyeSk7XG4gIH1cbn0pO1xuXG4vLyBUZXN0cyBmb3IgRGlyZWN0b3J5U3luYyBpbnN0cnVtZW50YXRpb25cbkRlbm8udGVzdChcIlRlbGVtZXRyeSAtIGluc3RydW1lbnREaXJlY3RvcnlTeW5jIHdyYXBzIG1ldGhvZHMgY29ycmVjdGx5XCIsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgbW9ja0RpcmVjdG9yeVN5bmMgPSBuZXcgTW9ja0RpcmVjdG9yeVN5bmMoKTtcblxuICAvLyBUcmFjayB0ZWxlbWV0cnkgbWV0aG9kIGNhbGxzXG4gIGxldCBzdGFydFNwYW5DYWxscyA9IDA7XG4gIGxldCBlbmRTcGFuQ2FsbHMgPSAwO1xuICBsZXQgcmVjb3JkTWV0cmljQ2FsbHMgPSAwO1xuICBsZXQgbGFzdFNwYW5OYW1lID0gXCJcIjtcbiAgbGV0IGxhc3RTcGFuQXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgbGV0IGxhc3RNZXRyaWNOYW1lID0gXCJcIjtcblxuICAvLyBDcmVhdGUgYSBwcm94aWVkIHRlbGVtZXRyeSBtYW5hZ2VyIHRvIHRyYWNrIGNhbGxzXG4gIGNvbnN0IHRyYWNrZWRNYW5hZ2VyID0ge1xuICAgIC4uLm1vY2tUZWxlbWV0cnlNYW5hZ2VyLFxuICAgIHN0YXJ0U3BhbjogKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgYXR0cmlidXRlcyA9IHt9LFxuICAgICAgcGFyZW50U3BhbklkPzogc3RyaW5nLFxuICAgICk6IHN0cmluZyA9PiB7XG4gICAgICBzdGFydFNwYW5DYWxscysrO1xuICAgICAgbGFzdFNwYW5OYW1lID0gbmFtZTtcbiAgICAgIGxhc3RTcGFuQXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gICAgICByZXR1cm4gbW9ja1RlbGVtZXRyeU1hbmFnZXIuc3RhcnRTcGFuKG5hbWUsIGF0dHJpYnV0ZXMsIHBhcmVudFNwYW5JZCk7XG4gICAgfSxcbiAgICBlbmRTcGFuOiAoXG4gICAgICBzcGFuSWQ6IHN0cmluZyxcbiAgICAgIHN0YXR1cyA9IFNwYW5TdGF0dXMuT0ssXG4gICAgICBtZXNzYWdlPzogc3RyaW5nLFxuICAgICAgYXR0cmlidXRlcyA9IHt9LFxuICAgICk6IHZvaWQgPT4ge1xuICAgICAgZW5kU3BhbkNhbGxzKys7XG4gICAgICBtb2NrVGVsZW1ldHJ5TWFuYWdlci5lbmRTcGFuKHNwYW5JZCwgc3RhdHVzLCBtZXNzYWdlLCBhdHRyaWJ1dGVzKTtcbiAgICB9LFxuICAgIHJlY29yZE1ldHJpYzogKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgdmFsdWU6IGFueSxcbiAgICAgIHR5cGUgPSBcImNvdW50ZXJcIixcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICApID0+IHtcbiAgICAgIHJlY29yZE1ldHJpY0NhbGxzKys7XG4gICAgICBsYXN0TWV0cmljTmFtZSA9IG5hbWU7XG4gICAgICBtb2NrVGVsZW1ldHJ5TWFuYWdlci5yZWNvcmRNZXRyaWMobmFtZSwgdmFsdWUsIHR5cGUsIGF0dHJpYnV0ZXMpO1xuICAgIH0sXG4gIH07XG5cbiAgLy8gUmVwbGFjZSBnbG9iYWwgdGVsZW1ldHJ5IHdpdGggb3VyIHRyYWNrZWQgbW9ja1xuICBjb25zdCBvcmlnaW5hbFRlbGVtZXRyeSA9IHsgLi4udGVsZW1ldHJ5IH07XG4gIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCB0cmFja2VkTWFuYWdlcik7XG5cbiAgdHJ5IHtcbiAgICAvLyBJbnN0cnVtZW50IHRoZSBEaXJlY3RvcnlTeW5jIGluc3RhbmNlXG4gICAgaW5zdHJ1bWVudERpcmVjdG9yeVN5bmMobW9ja0RpcmVjdG9yeVN5bmMgYXMgYW55KTtcblxuICAgIC8vIFRlc3QgbGlzdFVzZXJzIG1ldGhvZFxuICAgIGF3YWl0IG1vY2tEaXJlY3RvcnlTeW5jLmxpc3RVc2Vycyh7IGRpcmVjdG9yeTogXCJkaXJfMTIzXCIgfSk7XG5cbiAgICAvLyBWZXJpZnkgdGVsZW1ldHJ5IHdhcyBjYXB0dXJlZFxuICAgIGFzc2VydEVxdWFscyhzdGFydFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKGVuZFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKHJlY29yZE1ldHJpY0NhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5OYW1lLCBcImRpcmVjdG9yeVN5bmMubGlzdFVzZXJzXCIpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0U3BhbkF0dHJpYnV0ZXNbXCJ3b3Jrb3MubW9kdWxlXCJdLCBcImRpcmVjdG9yeVN5bmNcIik7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RTcGFuQXR0cmlidXRlc1tcImRpcmVjdG9yeVN5bmMuZGlyZWN0b3J5XCJdLCBcImRpcl8xMjNcIik7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RNZXRyaWNOYW1lLCBcImRpcmVjdG9yeV9zeW5jLnVzZXJfcXVlcmllc1wiKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZXN0b3JlIG9yaWdpbmFsIHRlbGVtZXRyeVxuICAgIE9iamVjdC5hc3NpZ24odGVsZW1ldHJ5LCBvcmlnaW5hbFRlbGVtZXRyeSk7XG4gIH1cbn0pO1xuXG4vLyBUZXN0cyBmb3IgVXNlck1hbmFnZW1lbnQgaW5zdHJ1bWVudGF0aW9uXG5EZW5vLnRlc3QoXCJUZWxlbWV0cnkgLSBpbnN0cnVtZW50VXNlck1hbmFnZW1lbnQgd3JhcHMgbWV0aG9kcyBjb3JyZWN0bHlcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBtb2NrVXNlck1hbmFnZW1lbnQgPSBuZXcgTW9ja1VzZXJNYW5hZ2VtZW50KCk7XG5cbiAgLy8gVHJhY2sgdGVsZW1ldHJ5IG1ldGhvZCBjYWxsc1xuICBsZXQgc3RhcnRTcGFuQ2FsbHMgPSAwO1xuICBsZXQgZW5kU3BhbkNhbGxzID0gMDtcbiAgbGV0IHJlY29yZE1ldHJpY0NhbGxzID0gMDtcbiAgbGV0IGxhc3RTcGFuTmFtZSA9IFwiXCI7XG4gIGxldCBsYXN0U3BhbkF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGxldCBsYXN0TWV0cmljTmFtZSA9IFwiXCI7XG5cbiAgLy8gQ3JlYXRlIGEgcHJveGllZCB0ZWxlbWV0cnkgbWFuYWdlciB0byB0cmFjayBjYWxsc1xuICBjb25zdCB0cmFja2VkTWFuYWdlciA9IHtcbiAgICAuLi5tb2NrVGVsZW1ldHJ5TWFuYWdlcixcbiAgICBzdGFydFNwYW46IChcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICAgIHBhcmVudFNwYW5JZD86IHN0cmluZyxcbiAgICApOiBzdHJpbmcgPT4ge1xuICAgICAgc3RhcnRTcGFuQ2FsbHMrKztcbiAgICAgIGxhc3RTcGFuTmFtZSA9IG5hbWU7XG4gICAgICBsYXN0U3BhbkF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgICAgcmV0dXJuIG1vY2tUZWxlbWV0cnlNYW5hZ2VyLnN0YXJ0U3BhbihuYW1lLCBhdHRyaWJ1dGVzLCBwYXJlbnRTcGFuSWQpO1xuICAgIH0sXG4gICAgZW5kU3BhbjogKFxuICAgICAgc3BhbklkOiBzdHJpbmcsXG4gICAgICBzdGF0dXMgPSBTcGFuU3RhdHVzLk9LLFxuICAgICAgbWVzc2FnZT86IHN0cmluZyxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICApOiB2b2lkID0+IHtcbiAgICAgIGVuZFNwYW5DYWxscysrO1xuICAgICAgbW9ja1RlbGVtZXRyeU1hbmFnZXIuZW5kU3BhbihzcGFuSWQsIHN0YXR1cywgbWVzc2FnZSwgYXR0cmlidXRlcyk7XG4gICAgfSxcbiAgICByZWNvcmRNZXRyaWM6IChcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIHZhbHVlOiBhbnksXG4gICAgICB0eXBlID0gXCJjb3VudGVyXCIsXG4gICAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgKSA9PiB7XG4gICAgICByZWNvcmRNZXRyaWNDYWxscysrO1xuICAgICAgbGFzdE1ldHJpY05hbWUgPSBuYW1lO1xuICAgICAgbW9ja1RlbGVtZXRyeU1hbmFnZXIucmVjb3JkTWV0cmljKG5hbWUsIHZhbHVlLCB0eXBlLCBhdHRyaWJ1dGVzKTtcbiAgICB9LFxuICB9O1xuXG4gIC8vIFJlcGxhY2UgZ2xvYmFsIHRlbGVtZXRyeSB3aXRoIG91ciB0cmFja2VkIG1vY2tcbiAgY29uc3Qgb3JpZ2luYWxUZWxlbWV0cnkgPSB7IC4uLnRlbGVtZXRyeSB9O1xuICBPYmplY3QuYXNzaWduKHRlbGVtZXRyeSwgdHJhY2tlZE1hbmFnZXIpO1xuXG4gIHRyeSB7XG4gICAgLy8gSW5zdHJ1bWVudCB0aGUgVXNlck1hbmFnZW1lbnQgaW5zdGFuY2VcbiAgICBpbnN0cnVtZW50VXNlck1hbmFnZW1lbnQobW9ja1VzZXJNYW5hZ2VtZW50IGFzIGFueSk7XG5cbiAgICAvLyBUZXN0IGF1dGhlbnRpY2F0ZVdpdGhQYXNzd29yZCBtZXRob2RcbiAgICBhd2FpdCBtb2NrVXNlck1hbmFnZW1lbnQuYXV0aGVudGljYXRlV2l0aFBhc3N3b3JkKHtcbiAgICAgIGVtYWlsOiBcInVzZXJAZXhhbXBsZS5jb21cIixcbiAgICAgIHBhc3N3b3JkOiBcInBhc3N3b3JkMTIzXCIsXG4gICAgfSk7XG5cbiAgICAvLyBWZXJpZnkgdGVsZW1ldHJ5IHdhcyBjYXB0dXJlZFxuICAgIGFzc2VydEVxdWFscyhzdGFydFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKGVuZFNwYW5DYWxscywgMSk7XG4gICAgYXNzZXJ0RXF1YWxzKHJlY29yZE1ldHJpY0NhbGxzLCAxKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5OYW1lLCBcInVzZXJNYW5hZ2VtZW50LmF1dGhlbnRpY2F0ZVdpdGhQYXNzd29yZFwiKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5BdHRyaWJ1dGVzW1wid29ya29zLm1vZHVsZVwiXSwgXCJ1c2VyTWFuYWdlbWVudFwiKTtcbiAgICBhc3NlcnRFcXVhbHMobGFzdFNwYW5BdHRyaWJ1dGVzW1wiYXV0aC5tZXRob2RcIl0sIFwicGFzc3dvcmRcIik7XG4gICAgYXNzZXJ0RXF1YWxzKGxhc3RTcGFuQXR0cmlidXRlc1tcInVzZXIuZW1haWxfZG9tYWluXCJdLCBcImV4YW1wbGUuY29tXCIpO1xuICAgIGFzc2VydEVxdWFscyhsYXN0TWV0cmljTmFtZSwgXCJ1c2VyX21hbmFnZW1lbnQuYXV0aGVudGljYXRpb25fYXR0ZW1wdHNcIik7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gUmVzdG9yZSBvcmlnaW5hbCB0ZWxlbWV0cnlcbiAgICBPYmplY3QuYXNzaWduKHRlbGVtZXRyeSwgb3JpZ2luYWxUZWxlbWV0cnkpO1xuICB9XG59KTtcblxuLy8gVGVzdHMgZm9yIFRlbGVtZXRyeU1hbmFnZXIgZnVuY3Rpb25hbGl0eVxuRGVuby50ZXN0KFwiVGVsZW1ldHJ5IC0gVGVsZW1ldHJ5TWFuYWdlciBzcGFuIGxpZmVjeWNsZVwiLCAoKSA9PiB7XG4gIGNvbnN0IG1hbmFnZXIgPSBuZXcgTW9ja1RlbGVtZXRyeU1hbmFnZXIoKTtcblxuICAvLyBTdGFydCBhIHNwYW5cbiAgY29uc3Qgc3BhbklkID0gbWFuYWdlci5zdGFydFNwYW4oXCJ0ZXN0Lm9wZXJhdGlvblwiLCB7XG4gICAgXCJjdXN0b20uYXR0cmlidXRlXCI6IFwidmFsdWVcIixcbiAgfSk7XG5cbiAgLy8gVmVyaWZ5IHNwYW4gaXMgYWN0aXZlXG4gIGFzc2VydEVxdWFscyhtYW5hZ2VyLmhhc1NwYW4oc3BhbklkKSwgdHJ1ZSk7XG5cbiAgLy8gRW5kIHRoZSBzcGFuXG4gIG1hbmFnZXIuZW5kU3BhbihzcGFuSWQsIFNwYW5TdGF0dXMuT0spO1xuXG4gIC8vIFZlcmlmeSBzcGFuIGlzIG5vIGxvbmdlciBhY3RpdmVcbiAgYXNzZXJ0RXF1YWxzKG1hbmFnZXIuaGFzU3BhbihzcGFuSWQpLCBmYWxzZSk7XG59KTtcblxuRGVuby50ZXN0KFwiVGVsZW1ldHJ5IC0gVGVsZW1ldHJ5TWFuYWdlciByZWNvcmRNZXRyaWNcIiwgKCkgPT4ge1xuICBjb25zdCBtYW5hZ2VyID0gbmV3IE1vY2tUZWxlbWV0cnlNYW5hZ2VyKCk7XG5cbiAgLy8gUmVjb3JkIGEgY291bnRlciBtZXRyaWNcbiAgbWFuYWdlci5yZWNvcmRNZXRyaWMoXCJ0ZXN0LmNvdW50ZXJcIiwgMSwgXCJjb3VudGVyXCIsIHtcbiAgICBcImN1c3RvbS5hdHRyaWJ1dGVcIjogXCJ2YWx1ZVwiLFxuICB9KTtcblxuICAvLyBWZXJpZnkgbWV0cmljIHdhcyByZWNvcmRlZFxuICBhc3NlcnRFcXVhbHMobWFuYWdlci5nZXRNZXRyaWNzQ291bnQoKSwgMSk7XG5cbiAgLy8gUmVjb3JkIGEgZ2F1Z2UgbWV0cmljXG4gIG1hbmFnZXIucmVjb3JkTWV0cmljKFwidGVzdC5nYXVnZVwiLCA0Mi41LCBcImdhdWdlXCIsIHtcbiAgICBcImN1c3RvbS5hdHRyaWJ1dGVcIjogXCJ2YWx1ZVwiLFxuICB9KTtcblxuICAvLyBWZXJpZnkgYW5vdGhlciBtZXRyaWMgd2FzIHJlY29yZGVkXG4gIGFzc2VydEVxdWFscyhtYW5hZ2VyLmdldE1ldHJpY3NDb3VudCgpLCAyKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJUZWxlbWV0cnkgLSBUZWxlbWV0cnlNYW5hZ2VyIHJlY29yZExvZ1wiLCAoKSA9PiB7XG4gIGNvbnN0IG1hbmFnZXIgPSBuZXcgTW9ja1RlbGVtZXRyeU1hbmFnZXIoKTtcblxuICAvLyBSZWNvcmQgYSBsb2dcbiAgbWFuYWdlci5yZWNvcmRMb2coXCJUZXN0IGxvZyBtZXNzYWdlXCIsIDksIHsgXCJjdXN0b20uYXR0cmlidXRlXCI6IFwidmFsdWVcIiB9KTtcblxuICAvLyBWZXJpZnkgbG9nIHdhcyByZWNvcmRlZFxuICBhc3NlcnRFcXVhbHMobWFuYWdlci5nZXRMb2dzQ291bnQoKSwgMSk7XG5cbiAgLy8gUmVjb3JkIGFub3RoZXIgbG9nIHdpdGggZGlmZmVyZW50IHNldmVyaXR5XG4gIG1hbmFnZXIucmVjb3JkTG9nKFwiRXJyb3IgbG9nIG1lc3NhZ2VcIiwgMTcsIHsgXCJlcnJvclwiOiB0cnVlIH0pO1xuXG4gIC8vIFZlcmlmeSBhbm90aGVyIGxvZyB3YXMgcmVjb3JkZWRcbiAgYXNzZXJ0RXF1YWxzKG1hbmFnZXIuZ2V0TG9nc0NvdW50KCksIDIpO1xufSk7XG5cbkRlbm8udGVzdChcIlRlbGVtZXRyeSAtIFRlbGVtZXRyeU1hbmFnZXIgZmx1c2hcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBtYW5hZ2VyID0gbmV3IE1vY2tUZWxlbWV0cnlNYW5hZ2VyKCk7XG5cbiAgLy8gU3RhcnQgc29tZSBzcGFucywgcmVjb3JkIG1ldHJpY3MgYW5kIGxvZ3NcbiAgY29uc3Qgc3BhbklkMSA9IG1hbmFnZXIuc3RhcnRTcGFuKFwidGVzdC5zcGFuMVwiKTtcbiAgY29uc3Qgc3BhbklkMiA9IG1hbmFnZXIuc3RhcnRTcGFuKFwidGVzdC5zcGFuMlwiKTtcbiAgbWFuYWdlci5yZWNvcmRNZXRyaWMoXCJ0ZXN0Lm1ldHJpY1wiLCAxKTtcbiAgbWFuYWdlci5yZWNvcmRMb2coXCJUZXN0IGxvZ1wiKTtcblxuICAvLyBFbmQgb25lIHNwYW4sIGxlYXZpbmcgdGhlIG90aGVyIGFjdGl2ZVxuICBtYW5hZ2VyLmVuZFNwYW4oc3BhbklkMSk7XG5cbiAgLy8gRmx1c2ggYWxsIGRhdGFcbiAgYXdhaXQgbWFuYWdlci5mbHVzaCgpO1xuXG4gIC8vIFZlcmlmeSBleHBvcnQgc3RhdHNcbiAgY29uc3Qgc3RhdHMgPSBtYW5hZ2VyLmdldEV4cG9ydFN0YXRzKCk7XG4gIGFzc2VydEVxdWFscyhzdGF0cy5zcGFuc0V4cG9ydGVkID4gMCwgdHJ1ZSk7XG4gIGFzc2VydEVxdWFscyhzdGF0cy5tZXRyaWNzRXhwb3J0ZWQgPiAwLCB0cnVlKTtcbiAgYXNzZXJ0RXF1YWxzKHN0YXRzLmxvZ3NFeHBvcnRlZCA+IDAsIHRydWUpO1xufSk7XG5cbi8vIFRlc3RzIGZvciBPVExQIEV4cG9ydGVyXG5EZW5vLnRlc3QoXCJUZWxlbWV0cnkgLSBPVExQSHR0cEV4cG9ydGVyIGdlbmVyYXRlcyB2YWxpZCBJRHNcIiwgKCkgPT4ge1xuICBjb25zdCBleHBvcnRlciA9IG5ldyBPVExQSHR0cEV4cG9ydGVyKHtcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIHNlcnZpY2VOYW1lOiBcInRlc3Qtc2VydmljZVwiLFxuICB9KTtcblxuICAvLyBHZW5lcmF0ZSB0cmFjZSBhbmQgc3BhbiBJRHNcbiAgY29uc3QgdHJhY2VJZCA9IGV4cG9ydGVyLmdlbmVyYXRlVHJhY2VJZCgpO1xuICBjb25zdCBzcGFuSWQgPSBleHBvcnRlci5nZW5lcmF0ZVNwYW5JZCgpO1xuXG4gIC8vIFZlcmlmeSBJRHMgaGF2ZSB0aGUgY29ycmVjdCBmb3JtYXQgYW5kIGxlbmd0aFxuICBhc3NlcnRFcXVhbHModHJhY2VJZC5sZW5ndGgsIDMyKTsgLy8gMTYgYnl0ZXMgYXMgaGV4XG4gIGFzc2VydEVxdWFscyhzcGFuSWQubGVuZ3RoLCAxNik7IC8vIDggYnl0ZXMgYXMgaGV4XG5cbiAgLy8gVmVyaWZ5IElEcyBhcmUgaGV4IHN0cmluZ3NcbiAgYXNzZXJ0RXF1YWxzKC9eWzAtOWEtZl0rJC8udGVzdCh0cmFjZUlkKSwgdHJ1ZSk7XG4gIGFzc2VydEVxdWFscygvXlswLTlhLWZdKyQvLnRlc3Qoc3BhbklkKSwgdHJ1ZSk7XG59KTtcblxuRGVuby50ZXN0KFwiVGVsZW1ldHJ5IC0gT1RMUEh0dHBFeHBvcnRlciBoYW5kbGVzIGVtcHR5IGV4cG9ydHMgZ3JhY2VmdWxseVwiLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGV4cG9ydGVyID0gbmV3IE9UTFBIdHRwRXhwb3J0ZXIoe1xuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgc2VydmljZU5hbWU6IFwidGVzdC1zZXJ2aWNlXCIsXG4gIH0pO1xuXG4gIC8vIFRlc3QgZXhwb3J0aW5nIGVtcHR5IGFycmF5c1xuICBhd2FpdCBleHBvcnRlci5leHBvcnRTcGFucyhbXSk7XG4gIGF3YWl0IGV4cG9ydGVyLmV4cG9ydE1ldHJpY3MoW10pO1xuICBhd2FpdCBleHBvcnRlci5leHBvcnRMb2dzKFtdKTtcblxuICAvLyBUaGVzZSBzaG91bGQgY29tcGxldGUgd2l0aG91dCBlcnJvclxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxZQUFZLFFBQXVDLGNBQWM7QUFFMUU7Ozs7Ozs7Q0FPQyxHQUVELG1DQUFtQztBQUNuQyxNQUFNO0VBQ0ksV0FBMEIsS0FBSztFQUMvQixhQUE0QixLQUFLO0VBQ2pDLFdBQW9CLEtBQUs7RUFDekIsaUJBQTBCO0VBQzFCLGNBQWMsTUFBTTtFQUU1QixZQUFZLGVBQXdCLENBQUMsQ0FBQyxFQUFFLGNBQWMsS0FBSyxDQUFFO0lBQzNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRztJQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHO0VBQ3JCO0VBRUEsTUFBTSxJQUFPLElBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUF3QjtJQUM3RCxJQUFJLENBQUMsUUFBUSxHQUFHO0lBQ2hCLElBQUksQ0FBQyxVQUFVLEdBQUc7SUFFbEIsSUFBSSxJQUFJ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
// denoCacheMetadata=1585404637845779715,15358388843107656017