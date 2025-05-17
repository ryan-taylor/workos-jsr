/**
 * WorkOS Telemetry Module
 *
 * This module provides lightweight instrumentation for WorkOS Deno SDK,
 * integrating with OpenTelemetry for monitoring long-running processes.
 */

import type { TelemetryConfig } from "./telemetry-config.ts";

/**
 * Metric types supported by the telemetry system
 */
export enum MetricType {
  /** Counter metrics track values that only increase, like request counts */
  COUNTER = "counter",
  /** Gauge metrics track values that can go up and down, like active connections */
  GAUGE = "gauge",
  /** Histogram metrics track distributions of values, like request durations */
  HISTOGRAM = "histogram",
}

/**
 * Attributes that can be attached to metrics or spans
 */
export type MetricAttributes = Record<string, string | number | boolean>;

/**
 * Base metric interface
 */
export interface Metric {
  /** Name of the metric */
  name: string;
  /** Type of the metric */
  type: MetricType;
  /** Current metric value */
  value: number | HistogramValue;
  /** Optional description of what the metric measures */
  description?: string;
  /** Metric unit (e.g., "ms", "bytes", "requests") */
  unit?: string;
  /** Additional attributes/dimensions for the metric */
  attributes?: MetricAttributes;
  /** Timestamp when the metric was recorded (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Counter metric for tracking cumulative values
 */
export interface CounterMetric extends Metric {
  type: MetricType.COUNTER;
  value: number;
}

/**
 * Gauge metric for tracking values that can go up or down
 */
export interface GaugeMetric extends Metric {
  type: MetricType.GAUGE;
  value: number;
}

/**
 * Histogram metrics track value distributions (buckets)
 */
export interface HistogramMetric extends Metric {
  type: MetricType.HISTOGRAM;
  value: HistogramValue;
}

/**
 * Histogram value with sum, count, and buckets
 */
export interface HistogramValue {
  /** Sum of all recorded values */
  sum: number;
  /** Count of all recorded values */
  count: number;
  /** Histogram buckets */
  buckets: HistogramBucket[];
}

/**
 * Histogram bucket representation
 */
export interface HistogramBucket {
  /** Upper bound of the bucket */
  upperBound: number;
  /** Count of values in the bucket */
  count: number;
}

/**
 * Span status codes for tracing
 */
export enum SpanStatus {
  /** Unset status */
  UNSET = 0,
  /** Successfully completed operation */
  OK = 1,
  /** Failed operation */
  ERROR = 2,
}

/**
 * Span interface for distributed tracing
 */
export interface Span {
  /** Unique identifier for this span */
  id: string;
  /** Name of the operation being traced */
  name: string;
  /** Trace ID this span belongs to */
  traceId: string;
  /** Parent span ID if any */
  parentId?: string;
  /** When the span started (milliseconds since epoch) */
  startTime: number;
  /** When the span ended (milliseconds since epoch) */
  endTime?: number;
  /** Current status of the span */
  status: SpanStatus;
  /** Optional status message */
  statusMessage?: string;
  /** Attributes attached to the span */
  attributes: MetricAttributes;
  /** Events that occurred during the span */
  events: SpanEvent[];
  /** Whether the span has ended */
  isEnded: boolean;

  /**
   * Adds an event to the span
   * @param name - Name of the event
   * @param attributes - Additional attributes for the event
   */
  addEvent(name: string, attributes?: MetricAttributes): void;

  /**
   * Sets the status of the span
   * @param status - New status code
   * @param message - Optional status message
   */
  setStatus(status: SpanStatus, message?: string): void;

  /**
   * Ends the span, setting its end time
   */
  end(): void;
}

/**
 * Event that occurs during a span
 */
export interface SpanEvent {
  /** Name of the event */
  name: string;
  /** When the event occurred (milliseconds since epoch) */
  timestamp: number;
  /** Additional attributes for the event */
  attributes?: MetricAttributes;
}

/**
 * Options for creating counters
 */
export interface CounterOptions {
  /** Description of what the counter measures */
  description?: string;
  /** Unit of measurement (e.g., "requests", "bytes") */
  unit?: string;
  /** Default attributes to attach to all measurements */
  defaultAttributes?: MetricAttributes;
}

/**
 * Options for creating gauges
 */
export interface GaugeOptions {
  /** Description of what the gauge measures */
  description?: string;
  /** Unit of measurement (e.g., "connections", "percentage") */
  unit?: string;
  /** Default attributes to attach to all measurements */
  defaultAttributes?: MetricAttributes;
}

/**
 * Options for creating histograms
 */
export interface HistogramOptions {
  /** Description of what the histogram measures */
  description?: string;
  /** Unit of measurement (e.g., "ms", "bytes") */
  unit?: string;
  /** Default attributes to attach to all measurements */
  defaultAttributes?: MetricAttributes;
}

/**
 * Options for creating spans
 */
export interface SpanOptions {
  /** Attributes to attach to the span */
  attributes?: MetricAttributes;
  /** Parent span ID if this is a child span */
  parentSpanId?: string;
}

/**
 * Counter interface for incrementing metrics
 */
export interface Counter {
  /** 
   * Add a value to the counter
   * @param value - Amount to add (must be positive)
   * @param attributes - Additional attributes for this measurement
   */
  add(value: number, attributes?: MetricAttributes): void;
  
  /**
   * Get the current counter value
   * @param attributes - Attributes to filter by
   */
  get(attributes?: MetricAttributes): number;
}

/**
 * Gauge interface for tracking values that can go up or down
 */
export interface Gauge {
  /**
   * Set the gauge to a specific value
   * @param value - New value
   * @param attributes - Additional attributes for this measurement
   */
  set(value: number, attributes?: MetricAttributes): void;
  
  /**
   * Get the current gauge value
   * @param attributes - Attributes to filter by
   */
  get(attributes?: MetricAttributes): number;
}

/**
 * Histogram interface for tracking value distributions
 */
export interface Histogram {
  /**
   * Record a value in the histogram
   * @param value - Value to record
   * @param attributes - Additional attributes for this measurement
   */
  record(value: number, attributes?: MetricAttributes): void;
}

/**
 * Singleton class that manages telemetry operations
 */
class TelemetryManager {
  /** Default configuration */
  private config: TelemetryConfig = {
    enabled: false,
    serviceName: "workos-deno-sdk",
    defaultAttributes: {},
    debug: false,
  };

  /** Registered metrics */
  private metrics: Metric[] = [];
  
  /** Active spans being traced */
  private activeSpans = new Map<string, Span>();
  
  /** Next ID for spans */
  private nextSpanId = 0;

  /**
   * Updates the telemetry configuration
   * @param config - New configuration options
   */
  updateConfig(config: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.config.debug) {
      console.log("[WorkOS Telemetry] Configuration updated:", this.config);
    }
  }

  /**
   * Returns whether debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.config.debug;
  }

  /**
   * Creates a new counter metric
   * @param name - Name of the counter
   * @param initialValue - Initial value (default: 0)
   * @param options - Counter options
   */
  createCounter(name: string, initialValue = 0, options: CounterOptions = {}): Counter {
    if (!this.config.enabled) {
      // Return a no-op counter if telemetry is disabled
      return {
        add: () => {},
        get: () => 0,
      };
    }

    const { description, unit, defaultAttributes } = options;
    
    // Add the initial counter metric
    const metric: CounterMetric = {
      name,
      type: MetricType.COUNTER,
      value: initialValue,
      description,
      unit,
      attributes: { ...this.config.defaultAttributes, ...defaultAttributes },
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);

    // Create and return the counter interface
    return {
      add: (value: number, attributes?: MetricAttributes) => {
        if (value < 0) {
          console.warn(`[WorkOS Telemetry] Counter ${name} cannot be decremented. Ignoring negative value: ${value}`);
          return;
        }

        const newMetric: CounterMetric = {
          name,
          type: MetricType.COUNTER,
          value,
          description,
          unit,
          attributes: {
            ...this.config.defaultAttributes,
            ...defaultAttributes,
            ...attributes,
          },
          timestamp: Date.now(),
        };
        
        this.metrics.push(newMetric);
        
        if (this.config.debug) {
          console.log(`[WorkOS Telemetry] Counter ${name} incremented by ${value}:`, newMetric);
        }
      },
      
      get: (attributes?: MetricAttributes) => {
        // Find the most recent matching counter
        const matchingMetrics = this.metrics
          .filter((m) => 
            m.name === name && 
            m.type === MetricType.COUNTER &&
            this.attributesMatch(m.attributes || {}, attributes || {})
          )
          .sort((a, b) => b.timestamp - a.timestamp);
        
        return matchingMetrics.length > 0 && typeof matchingMetrics[0].value === 'number' 
          ? matchingMetrics[0].value 
          : 0;
      },
    };
  }

  /**
   * Creates a new gauge metric
   * @param name - Name of the gauge
   * @param options - Gauge options
   */
  createGauge(name: string, options: GaugeOptions = {}): Gauge {
    if (!this.config.enabled) {
      // Return a no-op gauge if telemetry is disabled
      return {
        set: () => {},
        get: () => 0,
      };
    }

    const { description, unit, defaultAttributes } = options;
    
    // Create and return the gauge interface
    return {
      set: (value: number, attributes?: MetricAttributes) => {
        const newMetric: GaugeMetric = {
          name,
          type: MetricType.GAUGE,
          value,
          description,
          unit,
          attributes: {
            ...this.config.defaultAttributes,
            ...defaultAttributes,
            ...attributes,
          },
          timestamp: Date.now(),
        };
        
        this.metrics.push(newMetric);
        
        if (this.config.debug) {
          console.log(`[WorkOS Telemetry] Gauge ${name} set to ${value}:`, newMetric);
        }
      },
      
      get: (attributes?: MetricAttributes) => {
        // Find the most recent matching gauge
        const matchingMetrics = this.metrics
          .filter((m) => 
            m.name === name && 
            m.type === MetricType.GAUGE &&
            this.attributesMatch(m.attributes || {}, attributes || {})
          )
          .sort((a, b) => b.timestamp - a.timestamp);
        
        return matchingMetrics.length > 0 && typeof matchingMetrics[0].value === 'number' 
          ? matchingMetrics[0].value 
          : 0;
      },
    };
  }

  /**
   * Creates a new histogram metric
   * @param name - Name of the histogram
   * @param bucketBoundaries - Upper bounds for histogram buckets
   * @param options - Histogram options
   */
  createHistogram(name: string, bucketBoundaries: number[], options: HistogramOptions = {}): Histogram {
    if (!this.config.enabled) {
      // Return a no-op histogram if telemetry is disabled
      return {
        record: () => {},
      };
    }

    // Ensure bucket boundaries are in ascending order
    const sortedBuckets = [...bucketBoundaries].sort((a, b) => a - b);
    
    const { description, unit, defaultAttributes } = options;
    
    // Initialize histogram buckets
    const buckets: HistogramBucket[] = sortedBuckets.map((upperBound) => ({
      upperBound,
      count: 0,
    }));
    
    // Initialize histogram data
    let sum = 0;
    let count = 0;
    
    // Create and return the histogram interface
    return {
      record: (value: number, attributes?: MetricAttributes) => {
        // Update histogram data
        sum += value;
        count += 1;
        
        // Update bucket counts
        const updatedBuckets = buckets.map((bucket) => ({
          upperBound: bucket.upperBound,
          count: value <= bucket.upperBound ? bucket.count + 1 : bucket.count,
        }));
        
        const histogramValue: HistogramValue = {
          sum,
          count,
          buckets: updatedBuckets,
        };
        
        const newMetric: HistogramMetric = {
          name,
          type: MetricType.HISTOGRAM,
          value: histogramValue,
          description,
          unit,
          attributes: {
            ...this.config.defaultAttributes,
            ...defaultAttributes,
            ...attributes,
          },
          timestamp: Date.now(),
        };
        
        this.metrics.push(newMetric);
        
        if (this.config.debug) {
          console.log(`[WorkOS Telemetry] Histogram ${name} recorded value ${value}:`, newMetric);
        }
      },
    };
  }

  /**
   * Creates a new span for tracing
   * @param name - Name of the operation being traced
   * @param options - Span options
   */
  createSpan(name: string, options: SpanOptions = {}): Span {
    if (!this.config.enabled) {
      // Return a no-op span if telemetry is disabled
      return {
        id: "disabled",
        name,
        traceId: "disabled",
        startTime: Date.now(),
        status: SpanStatus.UNSET,
        attributes: {},
        events: [],
        isEnded: false,
        addEvent: () => {},
        setStatus: () => {},
        end: () => {},
      };
    }

    const { attributes = {}, parentSpanId } = options;
    
    // Generate a new span ID
    const id = `span-${++this.nextSpanId}`;
    
    // Generate or inherit trace ID
    let traceId: string;
    if (parentSpanId && this.activeSpans.has(parentSpanId)) {
      const parentSpan = this.activeSpans.get(parentSpanId)!;
      traceId = parentSpan.traceId;
    } else {
      traceId = `trace-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }
    
    const now = Date.now();
    
    // Create the span
    const span: Span = {
      id,
      name,
      traceId,
      parentId: parentSpanId,
      startTime: now,
      status: SpanStatus.UNSET,
      attributes: {
        ...this.config.defaultAttributes,
        ...attributes,
        "service.name": this.config.serviceName || "workos-deno-sdk",
      },
      events: [],
      isEnded: false,
      
      addEvent(eventName: string, eventAttributes?: MetricAttributes) {
        if (this.isEnded) {
          console.warn(`[WorkOS Telemetry] Cannot add event to already ended span: ${id}`);
          return;
        }
        
        this.events.push({
          name: eventName,
          timestamp: Date.now(),
          attributes: eventAttributes,
        });
        
        if (telemetry.config.debug) {
          console.log(`[WorkOS Telemetry] Span ${id} added event: ${eventName}`);
        }
      },
      
      setStatus(status: SpanStatus, message?: string) {
        if (this.isEnded) {
          console.warn(`[WorkOS Telemetry] Cannot set status on already ended span: ${id}`);
          return;
        }
        
        this.status = status;
        this.statusMessage = message;
        
        if (telemetry.config.debug) {
          console.log(`[WorkOS Telemetry] Span ${id} status set to: ${status}${message ? ` (${message})` : ''}`);
        }
      },
      
      end() {
        if (this.isEnded) {
          console.warn(`[WorkOS Telemetry] Span ${id} already ended`);
          return;
        }
        
        this.endTime = Date.now();
        this.isEnded = true;
        
        // Remove from active spans
        telemetry.activeSpans.delete(id);
        
        // Record span duration as a metric
        if (telemetry.config.enabled) {
          const durationMs = this.endTime - this.startTime;
          
          const spanMetric: GaugeMetric = {
            name: "span.duration",
            type: MetricType.GAUGE,
            value: durationMs,
            description: "Duration of spans in milliseconds",
            unit: "ms",
            attributes: {
              ...this.attributes,
              "span.name": this.name,
              "span.status": String(this.status),
            },
            timestamp: this.endTime,
          };
          
          telemetry.metrics.push(spanMetric);
        }
        
        if (telemetry.config.debug) {
          console.log(`[WorkOS Telemetry] Span ${id} ended, duration: ${this.endTime - this.startTime}ms`);
        }
      },
    };
    
    // Store in active spans
    this.activeSpans.set(id, span);
    
    if (this.config.debug) {
      console.log(`[WorkOS Telemetry] Created span: ${id}`, {
        name,
        traceId,
        parentId: parentSpanId,
      });
    }
    
    return span;
  }

  /**
   * Creates a child span from a parent span
   * @param name - Name of the child operation
   * @param parentSpanId - ID of the parent span
   * @param attributes - Additional attributes for the child span
   */
  createChildSpan(name: string, parentSpanId: string, attributes: MetricAttributes = {}): Span {
    return this.createSpan(name, { parentSpanId, attributes });
  }

  /**
   * Export metrics to external systems (currently just returns them)
   * This could be extended to send metrics to an OpenTelemetry collector
   */
  exportMetrics(): Metric[] {
    if (!this.config.enabled) {
      return [];
    }
    
    if (this.config.debug) {
      console.log(`[WorkOS Telemetry] Exporting ${this.metrics.length} metrics`);
    }
    
    return this.metrics;
  }

  /**
   * Gets all collected metrics
   */
  getAllMetrics(): Metric[] {
    return this.metrics;
  }

  /**
   * Creates a span for measuring the execution time of a function
   * @param name - Name for the span
   * @param fn - Function to execute and measure
   * @param options - Span options
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options: SpanOptions = {},
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }
    
    const span = this.createSpan(name, options);
    
    try {
      const result = await fn();
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      span.setStatus(
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a span for measuring the execution time of a synchronous function
   * @param name - Name for the span
   * @param fn - Function to execute and measure
   * @param options - Span options
   */
  measure<T>(name: string, fn: () => T, options: SpanOptions = {}): T {
    if (!this.config.enabled) {
      return fn();
    }
    
    const span = this.createSpan(name, options);
    
    try {
      const result = fn();
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      span.setStatus(
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Removes all collected metrics and spans
   * Useful for testing or when metrics need to be reset
   */
  reset(): void {
    this.metrics = [];
    this.activeSpans.clear();
    this.nextSpanId = 0;
    
    if (this.config.debug) {
      console.log("[WorkOS Telemetry] Reset all metrics and spans");
    }
  }

  /**
   * Checks if attributes match a filter
   * A match occurs when all filter attributes are present in the target
   * @param target - Target attributes
   * @param filter - Filter attributes
   */
  private attributesMatch(
    target: MetricAttributes,
    filter: MetricAttributes,
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (target[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

// Create singleton instance
export const telemetry = new TelemetryManager();

/**
 * Create a counter metric with the given name and options
 * @param name - Name of the counter
 * @param initialValue - Initial value (default: 0)
 * @param options - Counter options
 */
export function createCounter(
  name: string,
  initialValue = 0,
  options: CounterOptions = {},
): Counter {
  return telemetry.createCounter(name, initialValue, options);
}

/**
 * Create a gauge metric with the given name and options
 * @param name - Name of the gauge
 * @param options - Gauge options
 */
export function createGauge(name: string, options: GaugeOptions = {}): Gauge {
  return telemetry.createGauge(name, options);
}

/**
 * Create a histogram metric with the given name, buckets, and options
 * @param name - Name of the histogram
 * @param bucketBoundaries - Upper bounds for histogram buckets
 * @param options - Histogram options
 */
export function createHistogram(
  name: string,
  bucketBoundaries: number[],
  options: HistogramOptions = {},
): Histogram {
  return telemetry.createHistogram(name, bucketBoundaries, options);
}

/**
 * Create a span for tracing operations
 * @param name - Name of the operation being traced
 * @param options - Span options
 */
export function createSpan(name: string, options: SpanOptions = {}): Span {
  return telemetry.createSpan(name, options);
}

/**
 * Create a child span from a parent span
 * @param name - Name of the child operation
 * @param parentSpanId - ID of the parent span
 * @param attributes - Additional attributes for the child span
 */
export function createChildSpan(
  name: string,
  parentSpanId: string,
  attributes: MetricAttributes = {},
): Span {
  return telemetry.createChildSpan(name, parentSpanId, attributes);
}

/**
 * Measure the execution time of an async function with a span
 * @param name - Name for the span
 * @param fn - Function to execute and measure
 * @param options - Span options
 */
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: SpanOptions = {},
): Promise<T> {
  return telemetry.measureAsync(name, fn, options);
}

/**
 * Measure the execution time of a synchronous function with a span
 * @param name - Name for the span
 * @param fn - Function to execute and measure
 * @param options - Span options
 */
export function measure<T>(
  name: string,
  fn: () => T,
  options: SpanOptions = {},
): T {
  return telemetry.measure(name, fn, options);
}