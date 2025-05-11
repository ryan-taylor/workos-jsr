/**
 * OpenTelemetry OTLP HTTP Exporter for Deno
 *
 * This module provides an implementation of the OpenTelemetry Protocol (OTLP) HTTP exporter
 * that works with Deno's native fetch API.
 */

import type { TelemetryConfig } from "./telemetry-config.ts";

/**
 * Types of telemetry data that can be exported
 */
export enum TelemetryType {
  SPANS = "spans",
  METRICS = "metrics",
  LOGS = "logs",
}

/**
 * Span data structure for OpenTelemetry
 */
export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes: Record<string, string | number | boolean | string[]>;
  status: {
    code: number;
    message?: string;
  };
  events?: {
    timeUnixNano: number;
    name: string;
    attributes?: Record<string, string | number | boolean | string[]>;
  }[];
}

/**
 * Metric data structure for OpenTelemetry
 */
export interface Metric {
  name: string;
  description?: string;
  unit?: string;
  type: "counter" | "gauge" | "histogram";
  value: number | {
    count: number;
    sum: number;
    buckets: {
      count: number;
      upperBound: number;
    }[];
  };
  attributes?: Record<string, string | number | boolean | string[]>;
  timestamp: number;
}

/**
 * Log data structure for OpenTelemetry
 */
export interface Log {
  timestamp: number;
  severityNumber: number;
  severityText?: string;
  body: string;
  attributes?: Record<string, string | number | boolean | string[]>;
  traceId?: string;
  spanId?: string;
}

/**
 * OTLP HTTP Exporter for sending telemetry data to an OpenTelemetry collector
 */
export class OTLPHttpExporter {
  private readonly endpoint: string;
  private readonly serviceName: string;
  private readonly defaultAttributes: Record<string, string>;
  private readonly debug: boolean;

  /**
   * Creates a new OTLP HTTP exporter
   *
   * @param config - Telemetry configuration
   */
  constructor(config: TelemetryConfig) {
    this.endpoint = config.endpoint || "http://localhost:4318";
    this.serviceName = config.serviceName || "workos-sdk";
    this.defaultAttributes = config.defaultAttributes || {};
    this.debug = config.debug || false;
  }

  /**
   * Generates a random ID for trace and span IDs
   *
   * @param bytes - Number of bytes for the ID
   * @returns Hexadecimal ID string
   */
  private generateId(bytes: number): string {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Generates a trace ID (16 bytes)
   *
   * @returns Trace ID string
   */
  public generateTraceId(): string {
    return this.generateId(16);
  }

  /**
   * Generates a span ID (8 bytes)
   *
   * @returns Span ID string
   */
  public generateSpanId(): string {
    return this.generateId(8);
  }

  /**
   * Exports spans to the OTLP endpoint
   *
   * @param spans - Array of spans to export
   * @returns Promise that resolves when the export is complete
   */
  public async exportSpans(spans: Span[]): Promise<void> {
    if (spans.length === 0) return;

    const enrichedSpans = spans.map((span) => ({
      ...span,
      attributes: {
        ...span.attributes,
        ...this.defaultAttributes,
        "service.name": this.serviceName,
      },
    }));

    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: {
              "service.name": this.serviceName,
              ...this.defaultAttributes,
            },
          },
          scopeSpans: [
            {
              scope: {
                name: "@workos/sdk",
                version: "1.0.0",
              },
              spans: enrichedSpans,
            },
          ],
        },
      ],
    };

    await this.sendTelemetry(TelemetryType.SPANS, payload);
  }

  /**
   * Exports metrics to the OTLP endpoint
   *
   * @param metrics - Array of metrics to export
   * @returns Promise that resolves when the export is complete
   */
  public async exportMetrics(metrics: Metric[]): Promise<void> {
    if (metrics.length === 0) return;

    const enrichedMetrics = metrics.map((metric) => {
      const baseMetric = {
        name: metric.name,
        description: metric.description || "",
        unit: metric.unit || "",
        attributes: {
          ...metric.attributes,
          ...this.defaultAttributes,
          "service.name": this.serviceName,
        },
      };

      if (metric.type === "counter") {
        return {
          ...baseMetric,
          sum: {
            dataPoints: [
              {
                timeUnixNano: BigInt(metric.timestamp * 1000000),
                asDouble: typeof metric.value === "number" ? metric.value : 0,
                attributes: baseMetric.attributes,
              },
            ],
            isMonotonic: true,
            aggregationTemporality: 1, // AGGREGATION_TEMPORALITY_CUMULATIVE
          },
        };
      } else if (metric.type === "gauge") {
        return {
          ...baseMetric,
          gauge: {
            dataPoints: [
              {
                timeUnixNano: BigInt(metric.timestamp * 1000000),
                asDouble: typeof metric.value === "number" ? metric.value : 0,
                attributes: baseMetric.attributes,
              },
            ],
          },
        };
      }

      // Histogram
      const histValue = metric.value as {
        count: number;
        sum: number;
        buckets: { count: number; upperBound: number }[];
      };

      return {
        ...baseMetric,
        histogram: {
          dataPoints: [
            {
              timeUnixNano: BigInt(metric.timestamp * 1000000),
              count: histValue.count,
              sum: histValue.sum,
              bucketCounts: histValue.buckets.map((b) => b.count),
              explicitBounds: histValue.buckets.map((b) => b.upperBound),
              attributes: baseMetric.attributes,
            },
          ],
          aggregationTemporality: 1, // AGGREGATION_TEMPORALITY_CUMULATIVE
        },
      };
    });

    const payload = {
      resourceMetrics: [
        {
          resource: {
            attributes: {
              "service.name": this.serviceName,
              ...this.defaultAttributes,
            },
          },
          scopeMetrics: [
            {
              scope: {
                name: "@workos/sdk",
                version: "1.0.0",
              },
              metrics: enrichedMetrics,
            },
          ],
        },
      ],
    };

    await this.sendTelemetry(TelemetryType.METRICS, payload);
  }

  /**
   * Exports logs to the OTLP endpoint
   *
   * @param logs - Array of logs to export
   * @returns Promise that resolves when the export is complete
   */
  public async exportLogs(logs: Log[]): Promise<void> {
    if (logs.length === 0) return;

    const enrichedLogs = logs.map((log) => ({
      ...log,
      attributes: {
        ...log.attributes,
        ...this.defaultAttributes,
        "service.name": this.serviceName,
      },
    }));

    const payload = {
      resourceLogs: [
        {
          resource: {
            attributes: {
              "service.name": this.serviceName,
              ...this.defaultAttributes,
            },
          },
          scopeLogs: [
            {
              scope: {
                name: "@workos/sdk",
                version: "1.0.0",
              },
              logRecords: enrichedLogs.map((log) => ({
                timeUnixNano: BigInt(log.timestamp * 1000000),
                severityNumber: log.severityNumber,
                severityText: log.severityText,
                body: {
                  stringValue: log.body,
                },
                attributes: Object.entries(log.attributes || {}).map((
                  [k, v],
                ) => ({
                  key: k,
                  value: {
                    stringValue: v.toString(),
                  },
                })),
                traceId: log.traceId,
                spanId: log.spanId,
              })),
            },
          ],
        },
      ],
    };

    await this.sendTelemetry(TelemetryType.LOGS, payload);
  }

  /**
   * Sends telemetry data to the OTLP endpoint
   *
   * @param type - Type of telemetry data
   * @param payload - Data payload
   * @returns Promise that resolves when the data is sent
   * @throws Error if the export fails
   */
  private async sendTelemetry(
    type: TelemetryType,
    payload: unknown,
  ): Promise<void> {
    const url = `${this.endpoint}/v1/${type}`;

    try {
      if (this.debug) {
        console.debug(`[WorkOS Telemetry] Exporting ${type} to ${url}`);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (this.debug) {
          console.error(
            `[WorkOS Telemetry] Error exporting ${type}: ${response.status} ${errorText}`,
          );
        }
      } else if (this.debug) {
        console.debug(`[WorkOS Telemetry] Successfully exported ${type}`);
      }
    } catch (error) {
      if (this.debug) {
        console.error(`[WorkOS Telemetry] Failed to export ${type}:`, error);
      }
      // We don't want to throw errors from telemetry to avoid breaking the application
    }
  }
}
