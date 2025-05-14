/**
 * Telemetry Manager for the WorkOS SDK
 *
 * This module provides a central manager for all telemetry instrumentation
 * across the SDK. It handles span creation, metrics collection, and log forwarding.
 */

import {
  defaultTelemetryConfig,
  type TelemetryConfig,
} from "./telemetry-config.ts";
import {
  type Log,
  type Metric,
  OTLPHttpExporter,
  type Span,
} from "./otlp-exporter.ts";

/**
 * Timer that tracks the duration of an operation
 */
class Timer {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Gets the elapsed time in nanoseconds
   */
  public readonly elapsedNanoseconds = (): bigint => {
    const elapsedMs = this.elapsedMilliseconds();
    return BigInt(Math.floor(elapsedMs * 1_000_000));
  };

  /**
   * Gets the elapsed time in milliseconds
   */
  public readonly elapsedMilliseconds = (): number => {
    return performance.now() - this.startTime;
  };
}

/**
 * Active span context for tracking nested spans
 */
interface ActiveSpan {
  id: string;
  traceId: string;
  name: string;
  startTimeUnixNano: number;
  timer: Timer;
  attributes: Record<string, string | number | boolean | string[]>;
  events: {
    timeUnixNano: number;
    name: string;
    attributes?: Record<string, string | number | boolean | string[]>;
  }[];
}

/**
 * SpanStatus represents the result of an operation
 */
export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

/**
 * Manager for all telemetry operations in the SDK
 */
export class TelemetryManager {
  private readonly exporter: OTLPHttpExporter;
  private readonly config: TelemetryConfig;
  private activeSpans: Map<string, ActiveSpan> = new Map();
  private batchedSpans: Span[] = [];
  private batchedMetrics: Metric[] = [];
  private batchedLogs: Log[] = [];
  private flushInterval: number | null = null;
  private isShutdown = false;

  /**
   * Creates a new TelemetryManager
   *
   * @param config - Telemetry configuration
   */
  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      ...defaultTelemetryConfig,
      ...config,
    };
    this.exporter = new OTLPHttpExporter(this.config);

    // Set up flush interval if telemetry is enabled
    if (this.config.enabled) {
      this.setupFlushInterval();
    }
  }

  /**
   * Sets up the interval to flush batched telemetry data
   */
  private setupFlushInterval(): void {
    // Only set up interval if not already set
    if (this.flushInterval === null) {
      // Flush every 5 seconds
      this.flushInterval = setInterval(() => {
        this.flush().catch((err) => {
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
   */
  public startSpan(
    name: string,
    attributes: Record<string, string | number | boolean | string[]> = {},
    parentSpanId?: string,
  ): string {
    // If telemetry is disabled, return a dummy span ID
    if (!this.config.enabled) {
      return "disabled";
    }

    const spanId = this.exporter.generateSpanId();

    // If this is a child span, use the parent's trace ID
    let traceId = this.exporter.generateTraceId();
    if (parentSpanId && this.activeSpans.has(parentSpanId)) {
      const parentSpan = this.activeSpans.get(parentSpanId)!;
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
        "service.name": this.config.serviceName || "workos-sdk",
      },
      events: [],
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
   */
  public addSpanEvent(
    spanId: string,
    name: string,
    attributes: Record<string, string | number | boolean | string[]> = {},
  ): void {
    // If telemetry is disabled or span doesn't exist, do nothing
    if (!this.config.enabled || !this.activeSpans.has(spanId)) {
      return;
    }

    const span = this.activeSpans.get(spanId)!;
    const now = Date.now();
    const timeUnixNano = now * 1_000_000;

    span.events.push({
      timeUnixNano,
      name,
      attributes,
    });

    if (this.config.debug) {
      console.debug(
        `[WorkOS Telemetry] Added event to span ${spanId}: ${name}`,
      );
    }
  }

  /**
   * Ends an active span
   *
   * @param spanId - ID of the span to end
   * @param status - Status code for the span
   * @param message - Optional status message
   * @param attributes - Optional additional attributes to add to the span
   */
  public endSpan(
    spanId: string,
    status: SpanStatus = SpanStatus.OK,
    message?: string,
    attributes: Record<string, string | number | boolean | string[]> = {},
  ): void {
    // If telemetry is disabled or the span ID is our dummy ID, do nothing
    if (!this.config.enabled || spanId === "disabled") {
      return;
    }

    // If the span doesn't exist, log a warning and return
    if (!this.activeSpans.has(spanId)) {
      if (this.config.debug) {
        console.warn(
          `[WorkOS Telemetry] Attempted to end non-existent span: ${spanId}`,
        );
      }
      return;
    }

    const span = this.activeSpans.get(spanId)!;
    const now = Date.now();
    const endTimeUnixNano = now * 1_000_000;

    // Create the span object to be exported
    const finalSpan: Span = {
      traceId: span.traceId,
      spanId: span.id,
      name: span.name,
      kind: 1, // SPAN_KIND_INTERNAL
      startTimeUnixNano: span.startTimeUnixNano,
      endTimeUnixNano,
      attributes: {
        ...span.attributes,
        ...attributes,
        "duration_ms": span.timer.elapsedMilliseconds(),
      },
      status: {
        code: status,
        message: message,
      },
      events: span.events,
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
      this.flush().catch((err) => {
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
   */
  public recordMetric(
    name: string,
    value: number | {
      count: number;
      sum: number;
      buckets: {
        count: number;
        upperBound: number;
      }[];
    },
    type: "counter" | "gauge" | "histogram" = "counter",
    attributes: Record<string, string | number | boolean | string[]> = {},
    description?: string,
    unit?: string,
  ): void {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();

    const metric: Metric = {
      name,
      description,
      unit,
      type,
      value,
      attributes: {
        ...attributes,
        "service.name": this.config.serviceName || "workos-sdk",
      },
      timestamp: now,
    };

    this.batchedMetrics.push(metric);

    if (this.config.debug) {
      console.debug(
        `[WorkOS Telemetry] Recorded metric: ${name}=${
          typeof value === "number" ? value : "complex"
        }`,
      );
    }

    // If we have enough metrics, flush them
    if (this.batchedMetrics.length >= 5) {
      this.flush().catch((err) => {
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
   */
  public recordLog(
    body: string,
    severity: number = 9, // INFO
    attributes: Record<string, string | number | boolean | string[]> = {},
    spanId?: string,
  ): void {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    let traceId: string | undefined;

    // If this log is associated with a span, get its trace ID
    if (spanId && this.activeSpans.has(spanId)) {
      const span = this.activeSpans.get(spanId)!;
      traceId = span.traceId;
    }

    // Map severity number to text
    let severityText: string;
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

    const log: Log = {
      timestamp: now,
      severityNumber: severity,
      severityText,
      body,
      attributes: {
        ...attributes,
        "service.name": this.config.serviceName || "workos-sdk",
      },
      traceId,
      spanId,
    };

    this.batchedLogs.push(log);

    if (this.config.debug) {
      console.debug(
        `[WorkOS Telemetry] Recorded log: [${severityText}] ${body}`,
      );
    }

    // If we have enough logs, flush them
    if (this.batchedLogs.length >= 10) {
      this.flush().catch((err) => {
        if (this.config.debug) {
          console.error("[WorkOS Telemetry] Error flushing logs:", err);
        }
      });
    }
  }

  /**
   * Flushes all batched telemetry data to the exporter
   */
  public async flush(): Promise<void> {
    // If telemetry is disabled, do nothing
    if (!this.config.enabled) {
      return;
    }

    const spans = [...this.batchedSpans];
    const metrics = [...this.batchedMetrics];
    const logs = [...this.batchedLogs];

    // Clear the batches before exporting to avoid duplicates if export fails
    this.batchedSpans = [];
    this.batchedMetrics = [];
    this.batchedLogs = [];

    // Export in parallel
    await Promise.all([
      spans.length > 0 ? this.exporter.exportSpans(spans) : Promise.resolve(),
      metrics.length > 0
        ? this.exporter.exportMetrics(metrics)
        : Promise.resolve(),
      logs.length > 0 ? this.exporter.exportLogs(logs) : Promise.resolve(),
    ]);

    if (this.config.debug) {
      console.debug(
        `[WorkOS Telemetry] Flushed ${spans.length} spans, ${metrics.length} metrics, ${logs.length} logs`,
      );
    }
  }

  /**
   * Shuts down the telemetry manager and flushes any remaining data
   */
  public async shutdown(): Promise<void> {
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
   */
  public instrument<T>(
    operation: string,
    attributes: Record<string, string | number | boolean | string[]> = {},
  ): (callback: (spanId: string) => Promise<T>) => Promise<T> {
    return async (callback: (spanId: string) => Promise<T>): Promise<T> => {
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
        this.endSpan(
          spanId,
          SpanStatus.ERROR,
          error instanceof Error ? error.message : String(error),
          {
            "error.type": error instanceof Error
              ? error.constructor.name
              : "Unknown",
          },
        );
        throw error;
      }
    };
  }
}

// Create a default instance for use throughout the SDK
export const telemetry = new TelemetryManager();
