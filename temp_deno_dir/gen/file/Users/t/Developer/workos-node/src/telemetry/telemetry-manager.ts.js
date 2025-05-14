/**
 * Telemetry Manager for the WorkOS SDK
 *
 * This module provides a central manager for all telemetry instrumentation
 * across the SDK. It handles span creation, metrics collection, and log forwarding.
 */ import { defaultTelemetryConfig } from "./telemetry-config.ts";
import { OTLPHttpExporter } from "./otlp-exporter.ts";
/**
 * Timer that tracks the duration of an operation
 */ class Timer {
  startTime;
  constructor(){
    this.startTime = performance.now();
  }
  /**
   * Gets the elapsed time in nanoseconds
   */ elapsedNanoseconds = ()=>{
    const elapsedMs = this.elapsedMilliseconds();
    return BigInt(Math.floor(elapsedMs * 1_000_000));
  };
  /**
   * Gets the elapsed time in milliseconds
   */ elapsedMilliseconds = ()=>{
    return performance.now() - this.startTime;
  };
}
/**
 * SpanStatus represents the result of an operation
 */ export var SpanStatus = /*#__PURE__*/ function(SpanStatus) {
  SpanStatus[SpanStatus["UNSET"] = 0] = "UNSET";
  SpanStatus[SpanStatus["OK"] = 1] = "OK";
  SpanStatus[SpanStatus["ERROR"] = 2] = "ERROR";
  return SpanStatus;
}({});
/**
 * Manager for all telemetry operations in the SDK
 */ export class TelemetryManager {
  exporter;
  config;
  activeSpans = new Map();
  batchedSpans = [];
  batchedMetrics = [];
  batchedLogs = [];
  flushInterval = null;
  isShutdown = false;
  /**
   * Creates a new TelemetryManager
   *
   * @param config - Telemetry configuration
   */ constructor(config = {}){
    this.config = {
      ...defaultTelemetryConfig,
      ...config
    };
    this.exporter = new OTLPHttpExporter(this.config);
    // Set up flush interval if telemetry is enabled
    if (this.config.enabled) {
      this.setupFlushInterval();
    }
  }
  /**
   * Sets up the interval to flush batched telemetry data
   */ setupFlushInterval() {
    // Only set up interval if not already set
    if (this.flushInterval === null) {
      // Flush every 5 seconds
      this.flushInterval = setInterval(()=>{
        this.flush().catch((err)=>{
          if (this.config.debug) {
            console.error("[WorkOS Telemetry] Error flushing telemetry:", err);
          }
        });
      }, 5000);
    }
  }
  /**
   * Starts a new span
   *
   * @param name - Name of the span
   * @param attributes - Optional attributes to attach to the span
   * @param parentSpanId - Optional parent span ID for nested spans
   * @returns Span ID that can be used to end the span
   */ startSpan(name, attributes = {}, parentSpanId) {
    // If telemetry is disabled, return a dummy span ID
    if (!this.config.enabled) {
      return "disabled";
    }
    const spanId = this.exporter.generateSpanId();
    // If this is a child span, use the parent's trace ID
    let traceId = this.exporter.generateTraceId();
    if (parentSpanId && this.activeSpans.has(parentSpanId)) {
      const parentSpan = this.activeSpans.get(parentSpanId);
      traceId = parentSpan.traceId;
    }
    const now = Date.now();
    const startTimeUnixNano = now * 1_000_000;
    this.activeSpans.set(spanId, {
      id: spanId,
      traceId,
      name,
      startTimeUnixNano,
      timer: new Timer(),
      attributes: {
        ...attributes,
        // Add standard OpenTelemetry attributes
        "service.name": this.config.serviceName || "workos-sdk"
      },
      events: []
    });
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Started span: ${name} (${spanId})`);
    }
    return spanId;
  }
  /**
   * Adds an event to an active span
   *
   * @param spanId - ID of the span to add the event to
   * @param name - Name of the event
   * @param attributes - Optional attributes to attach to the event
   */ addSpanEvent(spanId, name, attributes = {}) {
    // If telemetry is disabled or span doesn't exist, do nothing
    if (!this.config.enabled || !this.activeSpans.has(spanId)) {
      return;
    }
    const span = this.activeSpans.get(spanId);
    const now = Date.now();
    const timeUnixNano = now * 1_000_000;
    span.events.push({
      timeUnixNano,
      name,
      attributes
    });
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Added event to span ${spanId}: ${name}`);
    }
  }
  /**
   * Ends an active span
   *
   * @param spanId - ID of the span to end
   * @param status - Status code for the span
   * @param message - Optional status message
   * @param attributes - Optional additional attributes to add to the span
   */ endSpan(spanId, status = SpanStatus.OK, message, attributes = {}) {
    // If telemetry is disabled or the span ID is our dummy ID, do nothing
    if (!this.config.enabled || spanId === "disabled") {
      return;
    }
    // If the span doesn't exist, log a warning and return
    if (!this.activeSpans.has(spanId)) {
      if (this.config.debug) {
        console.warn(`[WorkOS Telemetry] Attempted to end non-existent span: ${spanId}`);
      }
      return;
    }
    const span = this.activeSpans.get(spanId);
    const now = Date.now();
    const endTimeUnixNano = now * 1_000_000;
    // Create the span object to be exported
    const finalSpan = {
      traceId: span.traceId,
      spanId: span.id,
      name: span.name,
      kind: 1,
      startTimeUnixNano: span.startTimeUnixNano,
      endTimeUnixNano,
      attributes: {
        ...span.attributes,
        ...attributes,
        "duration_ms": span.timer.elapsedMilliseconds()
      },
      status: {
        code: status,
        message: message
      },
      events: span.events
    };
    // Add to the batch of spans to be exported
    this.batchedSpans.push(finalSpan);
    // Remove the span from active spans
    this.activeSpans.delete(spanId);
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Ended span: ${span.name} (${spanId})`);
    }
    // If we have enough spans, flush them
    if (this.batchedSpans.length >= 5) {
      this.flush().catch((err)=>{
        if (this.config.debug) {
          console.error("[WorkOS Telemetry] Error flushing spans:", err);
        }
      });
    }
  }
  /**
   * Records a metric
   *
   * @param name - Name of the metric
   * @param value - Value of the metric
   * @param type - Type of metric (counter, gauge, histogram)
   * @param attributes - Optional attributes to attach to the metric
   * @param description - Optional description of the metric
   * @param unit - Optional unit of the metric
   */ recordMetric(name, value, type = "counter", attributes = {}, description, unit) {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }
    const now = Date.now();
    const metric = {
      name,
      description,
      unit,
      type,
      value,
      attributes: {
        ...attributes,
        "service.name": this.config.serviceName || "workos-sdk"
      },
      timestamp: now
    };
    this.batchedMetrics.push(metric);
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Recorded metric: ${name}=${typeof value === "number" ? value : "complex"}`);
    }
    // If we have enough metrics, flush them
    if (this.batchedMetrics.length >= 5) {
      this.flush().catch((err)=>{
        if (this.config.debug) {
          console.error("[WorkOS Telemetry] Error flushing metrics:", err);
        }
      });
    }
  }
  /**
   * Records a log entry
   *
   * @param body - Log message body
   * @param severity - Log severity (0-24, where 0 is unspecified, 1-4 is trace, 5-8 is debug, etc.)
   * @param attributes - Optional attributes to attach to the log
   * @param spanId - Optional associated span ID
   */ recordLog(body, severity = 9, attributes = {}, spanId) {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }
    const now = Date.now();
    let traceId;
    // If this log is associated with a span, get its trace ID
    if (spanId && this.activeSpans.has(spanId)) {
      const span = this.activeSpans.get(spanId);
      traceId = span.traceId;
    }
    // Map severity number to text
    let severityText;
    if (severity <= 4) {
      severityText = "TRACE";
    } else if (severity <= 8) {
      severityText = "DEBUG";
    } else if (severity <= 12) {
      severityText = "INFO";
    } else if (severity <= 16) {
      severityText = "WARN";
    } else {
      severityText = "ERROR";
    }
    const log = {
      timestamp: now,
      severityNumber: severity,
      severityText,
      body,
      attributes: {
        ...attributes,
        "service.name": this.config.serviceName || "workos-sdk"
      },
      traceId,
      spanId
    };
    this.batchedLogs.push(log);
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Recorded log: [${severityText}] ${body}`);
    }
    // If we have enough logs, flush them
    if (this.batchedLogs.length >= 10) {
      this.flush().catch((err)=>{
        if (this.config.debug) {
          console.error("[WorkOS Telemetry] Error flushing logs:", err);
        }
      });
    }
  }
  /**
   * Flushes all batched telemetry data to the exporter
   */ async flush() {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }
    const spans = [
      ...this.batchedSpans
    ];
    const metrics = [
      ...this.batchedMetrics
    ];
    const logs = [
      ...this.batchedLogs
    ];
    // Clear the batches before exporting to avoid duplicates if export fails
    this.batchedSpans = [];
    this.batchedMetrics = [];
    this.batchedLogs = [];
    // Export in parallel
    await Promise.all([
      spans.length > 0 ? this.exporter.exportSpans(spans) : Promise.resolve(),
      metrics.length > 0 ? this.exporter.exportMetrics(metrics) : Promise.resolve(),
      logs.length > 0 ? this.exporter.exportLogs(logs) : Promise.resolve()
    ]);
    if (this.config.debug) {
      console.debug(`[WorkOS Telemetry] Flushed ${spans.length} spans, ${metrics.length} metrics, ${logs.length} logs`);
    }
  }
  /**
   * Shuts down the telemetry manager and flushes any remaining data
   */ async shutdown() {
    // If already shutdown or telemetry is disabled, do nothing
    if (this.isShutdown || !this.config.enabled) {
      return;
    }
    this.isShutdown = true;
    // Clear the flush interval
    if (this.flushInterval !== null) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    // Flush any remaining telemetry data
    await this.flush();
    if (this.config.debug) {
      console.debug("[WorkOS Telemetry] Telemetry manager shut down");
    }
  }
  /**
   * Creates a convenience wrapper for instrumenting an operation with a span
   *
   * @param operation - The operation name
   * @param attributes - Optional attributes to attach to the span
   * @returns Function that takes a callback and executes it within a span
   */ instrument(operation, attributes = {}) {
    return async (callback)=>{
      // Start a span for this operation
      const spanId = this.startSpan(operation, attributes);
      try {
        // Execute the callback with the span ID
        const result = await callback(spanId);
        // End the span with success status
        this.endSpan(spanId, SpanStatus.OK);
        return result;
      } catch (error) {
        // End the span with error status
        this.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error), {
          "error.type": error instanceof Error ? error.constructor.name : "Unknown"
        });
        throw error;
      }
    };
  }
}
// Create a default instance for use throughout the SDK
export const telemetry = new TelemetryManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc3JjL3RlbGVtZXRyeS90ZWxlbWV0cnktbWFuYWdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlbGVtZXRyeSBNYW5hZ2VyIGZvciB0aGUgV29ya09TIFNES1xuICpcbiAqIFRoaXMgbW9kdWxlIHByb3ZpZGVzIGEgY2VudHJhbCBtYW5hZ2VyIGZvciBhbGwgdGVsZW1ldHJ5IGluc3RydW1lbnRhdGlvblxuICogYWNyb3NzIHRoZSBTREsuIEl0IGhhbmRsZXMgc3BhbiBjcmVhdGlvbiwgbWV0cmljcyBjb2xsZWN0aW9uLCBhbmQgbG9nIGZvcndhcmRpbmcuXG4gKi9cblxuaW1wb3J0IHtcbiAgZGVmYXVsdFRlbGVtZXRyeUNvbmZpZyxcbiAgdHlwZSBUZWxlbWV0cnlDb25maWcsXG59IGZyb20gXCIuL3RlbGVtZXRyeS1jb25maWcudHNcIjtcbmltcG9ydCB7XG4gIHR5cGUgTG9nLFxuICB0eXBlIE1ldHJpYyxcbiAgT1RMUEh0dHBFeHBvcnRlcixcbiAgdHlwZSBTcGFuLFxufSBmcm9tIFwiLi9vdGxwLWV4cG9ydGVyLnRzXCI7XG5cbi8qKlxuICogVGltZXIgdGhhdCB0cmFja3MgdGhlIGR1cmF0aW9uIG9mIGFuIG9wZXJhdGlvblxuICovXG5jbGFzcyBUaW1lciB7XG4gIHByaXZhdGUgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbGFwc2VkIHRpbWUgaW4gbmFub3NlY29uZHNcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBlbGFwc2VkTmFub3NlY29uZHMgPSAoKTogYmlnaW50ID0+IHtcbiAgICBjb25zdCBlbGFwc2VkTXMgPSB0aGlzLmVsYXBzZWRNaWxsaXNlY29uZHMoKTtcbiAgICByZXR1cm4gQmlnSW50KE1hdGguZmxvb3IoZWxhcHNlZE1zICogMV8wMDBfMDAwKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVsYXBzZWQgdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBlbGFwc2VkTWlsbGlzZWNvbmRzID0gKCk6IG51bWJlciA9PiB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5zdGFydFRpbWU7XG4gIH07XG59XG5cbi8qKlxuICogQWN0aXZlIHNwYW4gY29udGV4dCBmb3IgdHJhY2tpbmcgbmVzdGVkIHNwYW5zXG4gKi9cbmludGVyZmFjZSBBY3RpdmVTcGFuIHtcbiAgaWQ6IHN0cmluZztcbiAgdHJhY2VJZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXJ0VGltZVVuaXhOYW5vOiBudW1iZXI7XG4gIHRpbWVyOiBUaW1lcjtcbiAgYXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHN0cmluZ1tdPjtcbiAgZXZlbnRzOiB7XG4gICAgdGltZVVuaXhOYW5vOiBudW1iZXI7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGF0dHJpYnV0ZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nW10+O1xuICB9W107XG59XG5cbi8qKlxuICogU3BhblN0YXR1cyByZXByZXNlbnRzIHRoZSByZXN1bHQgb2YgYW4gb3BlcmF0aW9uXG4gKi9cbmV4cG9ydCBlbnVtIFNwYW5TdGF0dXMge1xuICBVTlNFVCA9IDAsXG4gIE9LID0gMSxcbiAgRVJST1IgPSAyLFxufVxuXG4vKipcbiAqIE1hbmFnZXIgZm9yIGFsbCB0ZWxlbWV0cnkgb3BlcmF0aW9ucyBpbiB0aGUgU0RLXG4gKi9cbmV4cG9ydCBjbGFzcyBUZWxlbWV0cnlNYW5hZ2VyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRlcjogT1RMUEh0dHBFeHBvcnRlcjtcbiAgcHJpdmF0ZSByZWFkb25seSBjb25maWc6IFRlbGVtZXRyeUNvbmZpZztcbiAgcHJpdmF0ZSBhY3RpdmVTcGFuczogTWFwPHN0cmluZywgQWN0aXZlU3Bhbj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgYmF0Y2hlZFNwYW5zOiBTcGFuW10gPSBbXTtcbiAgcHJpdmF0ZSBiYXRjaGVkTWV0cmljczogTWV0cmljW10gPSBbXTtcbiAgcHJpdmF0ZSBiYXRjaGVkTG9nczogTG9nW10gPSBbXTtcbiAgcHJpdmF0ZSBmbHVzaEludGVydmFsOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBpc1NodXRkb3duID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVGVsZW1ldHJ5TWFuYWdlclxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlnIC0gVGVsZW1ldHJ5IGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUGFydGlhbDxUZWxlbWV0cnlDb25maWc+ID0ge30pIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIC4uLmRlZmF1bHRUZWxlbWV0cnlDb25maWcsXG4gICAgICAuLi5jb25maWcsXG4gICAgfTtcbiAgICB0aGlzLmV4cG9ydGVyID0gbmV3IE9UTFBIdHRwRXhwb3J0ZXIodGhpcy5jb25maWcpO1xuXG4gICAgLy8gU2V0IHVwIGZsdXNoIGludGVydmFsIGlmIHRlbGVtZXRyeSBpcyBlbmFibGVkXG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuc2V0dXBGbHVzaEludGVydmFsKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGludGVydmFsIHRvIGZsdXNoIGJhdGNoZWQgdGVsZW1ldHJ5IGRhdGFcbiAgICovXG4gIHByaXZhdGUgc2V0dXBGbHVzaEludGVydmFsKCk6IHZvaWQge1xuICAgIC8vIE9ubHkgc2V0IHVwIGludGVydmFsIGlmIG5vdCBhbHJlYWR5IHNldFxuICAgIGlmICh0aGlzLmZsdXNoSW50ZXJ2YWwgPT09IG51bGwpIHtcbiAgICAgIC8vIEZsdXNoIGV2ZXJ5IDUgc2Vjb25kc1xuICAgICAgdGhpcy5mbHVzaEludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICB0aGlzLmZsdXNoKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltXb3JrT1MgVGVsZW1ldHJ5XSBFcnJvciBmbHVzaGluZyB0ZWxlbWV0cnk6XCIsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sIDUwMDApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgYSBuZXcgc3BhblxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSAtIE5hbWUgb2YgdGhlIHNwYW5cbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBPcHRpb25hbCBhdHRyaWJ1dGVzIHRvIGF0dGFjaCB0byB0aGUgc3BhblxuICAgKiBAcGFyYW0gcGFyZW50U3BhbklkIC0gT3B0aW9uYWwgcGFyZW50IHNwYW4gSUQgZm9yIG5lc3RlZCBzcGFuc1xuICAgKiBAcmV0dXJucyBTcGFuIElEIHRoYXQgY2FuIGJlIHVzZWQgdG8gZW5kIHRoZSBzcGFuXG4gICAqL1xuICBwdWJsaWMgc3RhcnRTcGFuKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhdHRyaWJ1dGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nW10+ID0ge30sXG4gICAgcGFyZW50U3BhbklkPzogc3RyaW5nLFxuICApOiBzdHJpbmcge1xuICAgIC8vIElmIHRlbGVtZXRyeSBpcyBkaXNhYmxlZCwgcmV0dXJuIGEgZHVtbXkgc3BhbiBJRFxuICAgIGlmICghdGhpcy5jb25maWcuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIFwiZGlzYWJsZWRcIjtcbiAgICB9XG5cbiAgICBjb25zdCBzcGFuSWQgPSB0aGlzLmV4cG9ydGVyLmdlbmVyYXRlU3BhbklkKCk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgY2hpbGQgc3BhbiwgdXNlIHRoZSBwYXJlbnQncyB0cmFjZSBJRFxuICAgIGxldCB0cmFjZUlkID0gdGhpcy5leHBvcnRlci5nZW5lcmF0ZVRyYWNlSWQoKTtcbiAgICBpZiAocGFyZW50U3BhbklkICYmIHRoaXMuYWN0aXZlU3BhbnMuaGFzKHBhcmVudFNwYW5JZCkpIHtcbiAgICAgIGNvbnN0IHBhcmVudFNwYW4gPSB0aGlzLmFjdGl2ZVNwYW5zLmdldChwYXJlbnRTcGFuSWQpITtcbiAgICAgIHRyYWNlSWQgPSBwYXJlbnRTcGFuLnRyYWNlSWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBzdGFydFRpbWVVbml4TmFubyA9IG5vdyAqIDFfMDAwXzAwMDtcblxuICAgIHRoaXMuYWN0aXZlU3BhbnMuc2V0KHNwYW5JZCwge1xuICAgICAgaWQ6IHNwYW5JZCxcbiAgICAgIHRyYWNlSWQsXG4gICAgICBuYW1lLFxuICAgICAgc3RhcnRUaW1lVW5peE5hbm8sXG4gICAgICB0aW1lcjogbmV3IFRpbWVyKCksXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIC4uLmF0dHJpYnV0ZXMsXG4gICAgICAgIC8vIEFkZCBzdGFuZGFyZCBPcGVuVGVsZW1ldHJ5IGF0dHJpYnV0ZXNcbiAgICAgICAgXCJzZXJ2aWNlLm5hbWVcIjogdGhpcy5jb25maWcuc2VydmljZU5hbWUgfHwgXCJ3b3Jrb3Mtc2RrXCIsXG4gICAgICB9LFxuICAgICAgZXZlbnRzOiBbXSxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgY29uc29sZS5kZWJ1ZyhgW1dvcmtPUyBUZWxlbWV0cnldIFN0YXJ0ZWQgc3BhbjogJHtuYW1lfSAoJHtzcGFuSWR9KWApO1xuICAgIH1cblxuICAgIHJldHVybiBzcGFuSWQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCB0byBhbiBhY3RpdmUgc3BhblxuICAgKlxuICAgKiBAcGFyYW0gc3BhbklkIC0gSUQgb2YgdGhlIHNwYW4gdG8gYWRkIHRoZSBldmVudCB0b1xuICAgKiBAcGFyYW0gbmFtZSAtIE5hbWUgb2YgdGhlIGV2ZW50XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVzIC0gT3B0aW9uYWwgYXR0cmlidXRlcyB0byBhdHRhY2ggdG8gdGhlIGV2ZW50XG4gICAqL1xuICBwdWJsaWMgYWRkU3BhbkV2ZW50KFxuICAgIHNwYW5JZDogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhdHRyaWJ1dGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nW10+ID0ge30sXG4gICk6IHZvaWQge1xuICAgIC8vIElmIHRlbGVtZXRyeSBpcyBkaXNhYmxlZCBvciBzcGFuIGRvZXNuJ3QgZXhpc3QsIGRvIG5vdGhpbmdcbiAgICBpZiAoIXRoaXMuY29uZmlnLmVuYWJsZWQgfHwgIXRoaXMuYWN0aXZlU3BhbnMuaGFzKHNwYW5JZCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzcGFuID0gdGhpcy5hY3RpdmVTcGFucy5nZXQoc3BhbklkKSE7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0aW1lVW5peE5hbm8gPSBub3cgKiAxXzAwMF8wMDA7XG5cbiAgICBzcGFuLmV2ZW50cy5wdXNoKHtcbiAgICAgIHRpbWVVbml4TmFubyxcbiAgICAgIG5hbWUsXG4gICAgICBhdHRyaWJ1dGVzLFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuY29uZmlnLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKFxuICAgICAgICBgW1dvcmtPUyBUZWxlbWV0cnldIEFkZGVkIGV2ZW50IHRvIHNwYW4gJHtzcGFuSWR9OiAke25hbWV9YCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVuZHMgYW4gYWN0aXZlIHNwYW5cbiAgICpcbiAgICogQHBhcmFtIHNwYW5JZCAtIElEIG9mIHRoZSBzcGFuIHRvIGVuZFxuICAgKiBAcGFyYW0gc3RhdHVzIC0gU3RhdHVzIGNvZGUgZm9yIHRoZSBzcGFuXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gT3B0aW9uYWwgc3RhdHVzIG1lc3NhZ2VcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBPcHRpb25hbCBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgdG8gYWRkIHRvIHRoZSBzcGFuXG4gICAqL1xuICBwdWJsaWMgZW5kU3BhbihcbiAgICBzcGFuSWQ6IHN0cmluZyxcbiAgICBzdGF0dXM6IFNwYW5TdGF0dXMgPSBTcGFuU3RhdHVzLk9LLFxuICAgIG1lc3NhZ2U/OiBzdHJpbmcsXG4gICAgYXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHN0cmluZ1tdPiA9IHt9LFxuICApOiB2b2lkIHtcbiAgICAvLyBJZiB0ZWxlbWV0cnkgaXMgZGlzYWJsZWQgb3IgdGhlIHNwYW4gSUQgaXMgb3VyIGR1bW15IElELCBkbyBub3RoaW5nXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5lbmFibGVkIHx8IHNwYW5JZCA9PT0gXCJkaXNhYmxlZFwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHNwYW4gZG9lc24ndCBleGlzdCwgbG9nIGEgd2FybmluZyBhbmQgcmV0dXJuXG4gICAgaWYgKCF0aGlzLmFjdGl2ZVNwYW5zLmhhcyhzcGFuSWQpKSB7XG4gICAgICBpZiAodGhpcy5jb25maWcuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBbV29ya09TIFRlbGVtZXRyeV0gQXR0ZW1wdGVkIHRvIGVuZCBub24tZXhpc3RlbnQgc3BhbjogJHtzcGFuSWR9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzcGFuID0gdGhpcy5hY3RpdmVTcGFucy5nZXQoc3BhbklkKSE7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBlbmRUaW1lVW5peE5hbm8gPSBub3cgKiAxXzAwMF8wMDA7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHNwYW4gb2JqZWN0IHRvIGJlIGV4cG9ydGVkXG4gICAgY29uc3QgZmluYWxTcGFuOiBTcGFuID0ge1xuICAgICAgdHJhY2VJZDogc3Bhbi50cmFjZUlkLFxuICAgICAgc3BhbklkOiBzcGFuLmlkLFxuICAgICAgbmFtZTogc3Bhbi5uYW1lLFxuICAgICAga2luZDogMSwgLy8gU1BBTl9LSU5EX0lOVEVSTkFMXG4gICAgICBzdGFydFRpbWVVbml4TmFubzogc3Bhbi5zdGFydFRpbWVVbml4TmFubyxcbiAgICAgIGVuZFRpbWVVbml4TmFubyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLi4uc3Bhbi5hdHRyaWJ1dGVzLFxuICAgICAgICAuLi5hdHRyaWJ1dGVzLFxuICAgICAgICBcImR1cmF0aW9uX21zXCI6IHNwYW4udGltZXIuZWxhcHNlZE1pbGxpc2Vjb25kcygpLFxuICAgICAgfSxcbiAgICAgIHN0YXR1czoge1xuICAgICAgICBjb2RlOiBzdGF0dXMsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICB9LFxuICAgICAgZXZlbnRzOiBzcGFuLmV2ZW50cyxcbiAgICB9O1xuXG4gICAgLy8gQWRkIHRvIHRoZSBiYXRjaCBvZiBzcGFucyB0byBiZSBleHBvcnRlZFxuICAgIHRoaXMuYmF0Y2hlZFNwYW5zLnB1c2goZmluYWxTcGFuKTtcblxuICAgIC8vIFJlbW92ZSB0aGUgc3BhbiBmcm9tIGFjdGl2ZSBzcGFuc1xuICAgIHRoaXMuYWN0aXZlU3BhbnMuZGVsZXRlKHNwYW5JZCk7XG5cbiAgICBpZiAodGhpcy5jb25maWcuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUuZGVidWcoYFtXb3JrT1MgVGVsZW1ldHJ5XSBFbmRlZCBzcGFuOiAke3NwYW4ubmFtZX0gKCR7c3BhbklkfSlgKTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIGVub3VnaCBzcGFucywgZmx1c2ggdGhlbVxuICAgIGlmICh0aGlzLmJhdGNoZWRTcGFucy5sZW5ndGggPj0gNSkge1xuICAgICAgdGhpcy5mbHVzaCgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltXb3JrT1MgVGVsZW1ldHJ5XSBFcnJvciBmbHVzaGluZyBzcGFuczpcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgYSBtZXRyaWNcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgLSBOYW1lIG9mIHRoZSBtZXRyaWNcbiAgICogQHBhcmFtIHZhbHVlIC0gVmFsdWUgb2YgdGhlIG1ldHJpY1xuICAgKiBAcGFyYW0gdHlwZSAtIFR5cGUgb2YgbWV0cmljIChjb3VudGVyLCBnYXVnZSwgaGlzdG9ncmFtKVxuICAgKiBAcGFyYW0gYXR0cmlidXRlcyAtIE9wdGlvbmFsIGF0dHJpYnV0ZXMgdG8gYXR0YWNoIHRvIHRoZSBtZXRyaWNcbiAgICogQHBhcmFtIGRlc2NyaXB0aW9uIC0gT3B0aW9uYWwgZGVzY3JpcHRpb24gb2YgdGhlIG1ldHJpY1xuICAgKiBAcGFyYW0gdW5pdCAtIE9wdGlvbmFsIHVuaXQgb2YgdGhlIG1ldHJpY1xuICAgKi9cbiAgcHVibGljIHJlY29yZE1ldHJpYyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IG51bWJlciB8IHtcbiAgICAgIGNvdW50OiBudW1iZXI7XG4gICAgICBzdW06IG51bWJlcjtcbiAgICAgIGJ1Y2tldHM6IHtcbiAgICAgICAgY291bnQ6IG51bWJlcjtcbiAgICAgICAgdXBwZXJCb3VuZDogbnVtYmVyO1xuICAgICAgfVtdO1xuICAgIH0sXG4gICAgdHlwZTogXCJjb3VudGVyXCIgfCBcImdhdWdlXCIgfCBcImhpc3RvZ3JhbVwiID0gXCJjb3VudGVyXCIsXG4gICAgYXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHN0cmluZ1tdPiA9IHt9LFxuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nLFxuICAgIHVuaXQ/OiBzdHJpbmcsXG4gICk6IHZvaWQge1xuICAgIC8vIElmIHRlbGVtZXRyeSBpcyBkaXNhYmxlZCwgZG8gbm90aGluZ1xuICAgIGlmICghdGhpcy5jb25maWcuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICBjb25zdCBtZXRyaWM6IE1ldHJpYyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBkZXNjcmlwdGlvbixcbiAgICAgIHVuaXQsXG4gICAgICB0eXBlLFxuICAgICAgdmFsdWUsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIC4uLmF0dHJpYnV0ZXMsXG4gICAgICAgIFwic2VydmljZS5uYW1lXCI6IHRoaXMuY29uZmlnLnNlcnZpY2VOYW1lIHx8IFwid29ya29zLXNka1wiLFxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbm93LFxuICAgIH07XG5cbiAgICB0aGlzLmJhdGNoZWRNZXRyaWNzLnB1c2gobWV0cmljKTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgYFtXb3JrT1MgVGVsZW1ldHJ5XSBSZWNvcmRlZCBtZXRyaWM6ICR7bmFtZX09JHtcbiAgICAgICAgICB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6IFwiY29tcGxleFwiXG4gICAgICAgIH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIGVub3VnaCBtZXRyaWNzLCBmbHVzaCB0aGVtXG4gICAgaWYgKHRoaXMuYmF0Y2hlZE1ldHJpY3MubGVuZ3RoID49IDUpIHtcbiAgICAgIHRoaXMuZmx1c2goKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbV29ya09TIFRlbGVtZXRyeV0gRXJyb3IgZmx1c2hpbmcgbWV0cmljczpcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgYSBsb2cgZW50cnlcbiAgICpcbiAgICogQHBhcmFtIGJvZHkgLSBMb2cgbWVzc2FnZSBib2R5XG4gICAqIEBwYXJhbSBzZXZlcml0eSAtIExvZyBzZXZlcml0eSAoMC0yNCwgd2hlcmUgMCBpcyB1bnNwZWNpZmllZCwgMS00IGlzIHRyYWNlLCA1LTggaXMgZGVidWcsIGV0Yy4pXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVzIC0gT3B0aW9uYWwgYXR0cmlidXRlcyB0byBhdHRhY2ggdG8gdGhlIGxvZ1xuICAgKiBAcGFyYW0gc3BhbklkIC0gT3B0aW9uYWwgYXNzb2NpYXRlZCBzcGFuIElEXG4gICAqL1xuICBwdWJsaWMgcmVjb3JkTG9nKFxuICAgIGJvZHk6IHN0cmluZyxcbiAgICBzZXZlcml0eTogbnVtYmVyID0gOSwgLy8gSU5GT1xuICAgIGF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXT4gPSB7fSxcbiAgICBzcGFuSWQ/OiBzdHJpbmcsXG4gICk6IHZvaWQge1xuICAgIC8vIElmIHRlbGVtZXRyeSBpcyBkaXNhYmxlZCwgZG8gbm90aGluZ1xuICAgIGlmICghdGhpcy5jb25maWcuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgbGV0IHRyYWNlSWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIC8vIElmIHRoaXMgbG9nIGlzIGFzc29jaWF0ZWQgd2l0aCBhIHNwYW4sIGdldCBpdHMgdHJhY2UgSURcbiAgICBpZiAoc3BhbklkICYmIHRoaXMuYWN0aXZlU3BhbnMuaGFzKHNwYW5JZCkpIHtcbiAgICAgIGNvbnN0IHNwYW4gPSB0aGlzLmFjdGl2ZVNwYW5zLmdldChzcGFuSWQpITtcbiAgICAgIHRyYWNlSWQgPSBzcGFuLnRyYWNlSWQ7XG4gICAgfVxuXG4gICAgLy8gTWFwIHNldmVyaXR5IG51bWJlciB0byB0ZXh0XG4gICAgbGV0IHNldmVyaXR5VGV4dDogc3RyaW5nO1xuICAgIGlmIChzZXZlcml0eSA8PSA0KSB7XG4gICAgICBzZXZlcml0eVRleHQgPSBcIlRSQUNFXCI7XG4gICAgfSBlbHNlIGlmIChzZXZlcml0eSA8PSA4KSB7XG4gICAgICBzZXZlcml0eVRleHQgPSBcIkRFQlVHXCI7XG4gICAgfSBlbHNlIGlmIChzZXZlcml0eSA8PSAxMikge1xuICAgICAgc2V2ZXJpdHlUZXh0ID0gXCJJTkZPXCI7XG4gICAgfSBlbHNlIGlmIChzZXZlcml0eSA8PSAxNikge1xuICAgICAgc2V2ZXJpdHlUZXh0ID0gXCJXQVJOXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldmVyaXR5VGV4dCA9IFwiRVJST1JcIjtcbiAgICB9XG5cbiAgICBjb25zdCBsb2c6IExvZyA9IHtcbiAgICAgIHRpbWVzdGFtcDogbm93LFxuICAgICAgc2V2ZXJpdHlOdW1iZXI6IHNldmVyaXR5LFxuICAgICAgc2V2ZXJpdHlUZXh0LFxuICAgICAgYm9keSxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLi4uYXR0cmlidXRlcyxcbiAgICAgICAgXCJzZXJ2aWNlLm5hbWVcIjogdGhpcy5jb25maWcuc2VydmljZU5hbWUgfHwgXCJ3b3Jrb3Mtc2RrXCIsXG4gICAgICB9LFxuICAgICAgdHJhY2VJZCxcbiAgICAgIHNwYW5JZCxcbiAgICB9O1xuXG4gICAgdGhpcy5iYXRjaGVkTG9ncy5wdXNoKGxvZyk7XG5cbiAgICBpZiAodGhpcy5jb25maWcuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIGBbV29ya09TIFRlbGVtZXRyeV0gUmVjb3JkZWQgbG9nOiBbJHtzZXZlcml0eVRleHR9XSAke2JvZHl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBlbm91Z2ggbG9ncywgZmx1c2ggdGhlbVxuICAgIGlmICh0aGlzLmJhdGNoZWRMb2dzLmxlbmd0aCA+PSAxMCkge1xuICAgICAgdGhpcy5mbHVzaCgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltXb3JrT1MgVGVsZW1ldHJ5XSBFcnJvciBmbHVzaGluZyBsb2dzOlwiLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmx1c2hlcyBhbGwgYmF0Y2hlZCB0ZWxlbWV0cnkgZGF0YSB0byB0aGUgZXhwb3J0ZXJcbiAgICovXG4gIHB1YmxpYyBhc3luYyBmbHVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiB0ZWxlbWV0cnkgaXMgZGlzYWJsZWQsIGRvIG5vdGhpbmdcbiAgICBpZiAoIXRoaXMuY29uZmlnLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzcGFucyA9IFsuLi50aGlzLmJhdGNoZWRTcGFuc107XG4gICAgY29uc3QgbWV0cmljcyA9IFsuLi50aGlzLmJhdGNoZWRNZXRyaWNzXTtcbiAgICBjb25zdCBsb2dzID0gWy4uLnRoaXMuYmF0Y2hlZExvZ3NdO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGJhdGNoZXMgYmVmb3JlIGV4cG9ydGluZyB0byBhdm9pZCBkdXBsaWNhdGVzIGlmIGV4cG9ydCBmYWlsc1xuICAgIHRoaXMuYmF0Y2hlZFNwYW5zID0gW107XG4gICAgdGhpcy5iYXRjaGVkTWV0cmljcyA9IFtdO1xuICAgIHRoaXMuYmF0Y2hlZExvZ3MgPSBbXTtcblxuICAgIC8vIEV4cG9ydCBpbiBwYXJhbGxlbFxuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHNwYW5zLmxlbmd0aCA+IDAgPyB0aGlzLmV4cG9ydGVyLmV4cG9ydFNwYW5zKHNwYW5zKSA6IFByb21pc2UucmVzb2x2ZSgpLFxuICAgICAgbWV0cmljcy5sZW5ndGggPiAwXG4gICAgICAgID8gdGhpcy5leHBvcnRlci5leHBvcnRNZXRyaWNzKG1ldHJpY3MpXG4gICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgICBsb2dzLmxlbmd0aCA+IDAgPyB0aGlzLmV4cG9ydGVyLmV4cG9ydExvZ3MobG9ncykgOiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICBdKTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5kZWJ1Zykge1xuICAgICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgYFtXb3JrT1MgVGVsZW1ldHJ5XSBGbHVzaGVkICR7c3BhbnMubGVuZ3RofSBzcGFucywgJHttZXRyaWNzLmxlbmd0aH0gbWV0cmljcywgJHtsb2dzLmxlbmd0aH0gbG9nc2AsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTaHV0cyBkb3duIHRoZSB0ZWxlbWV0cnkgbWFuYWdlciBhbmQgZmx1c2hlcyBhbnkgcmVtYWluaW5nIGRhdGFcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiBhbHJlYWR5IHNodXRkb3duIG9yIHRlbGVtZXRyeSBpcyBkaXNhYmxlZCwgZG8gbm90aGluZ1xuICAgIGlmICh0aGlzLmlzU2h1dGRvd24gfHwgIXRoaXMuY29uZmlnLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmlzU2h1dGRvd24gPSB0cnVlO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGZsdXNoIGludGVydmFsXG4gICAgaWYgKHRoaXMuZmx1c2hJbnRlcnZhbCAhPT0gbnVsbCkge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmZsdXNoSW50ZXJ2YWwpO1xuICAgICAgdGhpcy5mbHVzaEludGVydmFsID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBGbHVzaCBhbnkgcmVtYWluaW5nIHRlbGVtZXRyeSBkYXRhXG4gICAgYXdhaXQgdGhpcy5mbHVzaCgpO1xuXG4gICAgaWYgKHRoaXMuY29uZmlnLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKFwiW1dvcmtPUyBUZWxlbWV0cnldIFRlbGVtZXRyeSBtYW5hZ2VyIHNodXQgZG93blwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNvbnZlbmllbmNlIHdyYXBwZXIgZm9yIGluc3RydW1lbnRpbmcgYW4gb3BlcmF0aW9uIHdpdGggYSBzcGFuXG4gICAqXG4gICAqIEBwYXJhbSBvcGVyYXRpb24gLSBUaGUgb3BlcmF0aW9uIG5hbWVcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBPcHRpb25hbCBhdHRyaWJ1dGVzIHRvIGF0dGFjaCB0byB0aGUgc3BhblxuICAgKiBAcmV0dXJucyBGdW5jdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2sgYW5kIGV4ZWN1dGVzIGl0IHdpdGhpbiBhIHNwYW5cbiAgICovXG4gIHB1YmxpYyBpbnN0cnVtZW50PFQ+KFxuICAgIG9wZXJhdGlvbjogc3RyaW5nLFxuICAgIGF0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXT4gPSB7fSxcbiAgKTogKGNhbGxiYWNrOiAoc3BhbklkOiBzdHJpbmcpID0+IFByb21pc2U8VD4pID0+IFByb21pc2U8VD4ge1xuICAgIHJldHVybiBhc3luYyAoY2FsbGJhY2s6IChzcGFuSWQ6IHN0cmluZykgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4gPT4ge1xuICAgICAgLy8gU3RhcnQgYSBzcGFuIGZvciB0aGlzIG9wZXJhdGlvblxuICAgICAgY29uc3Qgc3BhbklkID0gdGhpcy5zdGFydFNwYW4ob3BlcmF0aW9uLCBhdHRyaWJ1dGVzKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gRXhlY3V0ZSB0aGUgY2FsbGJhY2sgd2l0aCB0aGUgc3BhbiBJRFxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjYWxsYmFjayhzcGFuSWQpO1xuICAgICAgICAvLyBFbmQgdGhlIHNwYW4gd2l0aCBzdWNjZXNzIHN0YXR1c1xuICAgICAgICB0aGlzLmVuZFNwYW4oc3BhbklkLCBTcGFuU3RhdHVzLk9LKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIEVuZCB0aGUgc3BhbiB3aXRoIGVycm9yIHN0YXR1c1xuICAgICAgICB0aGlzLmVuZFNwYW4oXG4gICAgICAgICAgc3BhbklkLFxuICAgICAgICAgIFNwYW5TdGF0dXMuRVJST1IsXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwiZXJyb3IudHlwZVwiOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICAgID8gZXJyb3IuY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICAgICA6IFwiVW5rbm93blwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxuLy8gQ3JlYXRlIGEgZGVmYXVsdCBpbnN0YW5jZSBmb3IgdXNlIHRocm91Z2hvdXQgdGhlIFNES1xuZXhwb3J0IGNvbnN0IHRlbGVtZXRyeSA9IG5ldyBUZWxlbWV0cnlNYW5hZ2VyKCk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0NBS0MsR0FFRCxTQUNFLHNCQUFzQixRQUVqQix3QkFBd0I7QUFDL0IsU0FHRSxnQkFBZ0IsUUFFWCxxQkFBcUI7QUFFNUI7O0NBRUMsR0FDRCxNQUFNO0VBQ0ksVUFBa0I7RUFFMUIsYUFBYztJQUNaLElBQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxHQUFHO0VBQ2xDO0VB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
// denoCacheMetadata=7544751316183890819,1111234424690283413