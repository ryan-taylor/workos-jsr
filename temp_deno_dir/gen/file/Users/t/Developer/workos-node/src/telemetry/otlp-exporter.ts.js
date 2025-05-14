/**
 * OpenTelemetry OTLP HTTP Exporter for Deno
 *
 * This module provides an implementation of the OpenTelemetry Protocol (OTLP) HTTP exporter
 * that works with Deno's native fetch API.
 */
/**
 * Types of telemetry data that can be exported
 */ export var TelemetryType = /*#__PURE__*/ function (TelemetryType) {
  TelemetryType["SPANS"] = "spans";
  TelemetryType["METRICS"] = "metrics";
  TelemetryType["LOGS"] = "logs";
  return TelemetryType;
}({});
/**
 * OTLP HTTP Exporter for sending telemetry data to an OpenTelemetry collector
 */ export class OTLPHttpExporter {
  endpoint;
  serviceName;
  defaultAttributes;
  debug;
  /**
   * Creates a new OTLP HTTP exporter
   *
   * @param config - Telemetry configuration
   */ constructor(config) {
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
   */ generateId(bytes) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
  }
  /**
   * Generates a trace ID (16 bytes)
   *
   * @returns Trace ID string
   */ generateTraceId() {
    return this.generateId(16);
  }
  /**
   * Generates a span ID (8 bytes)
   *
   * @returns Span ID string
   */ generateSpanId() {
    return this.generateId(8);
  }
  /**
   * Exports spans to the OTLP endpoint
   *
   * @param spans - Array of spans to export
   * @returns Promise that resolves when the export is complete
   */ async exportSpans(spans) {
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
   */ async exportMetrics(metrics) {
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
            aggregationTemporality: 1,
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
      const histValue = metric.value;
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
          aggregationTemporality: 1,
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
   */ async exportLogs(logs) {
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
   */ async sendTelemetry(type, payload) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc3JjL3RlbGVtZXRyeS9vdGxwLWV4cG9ydGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT3BlblRlbGVtZXRyeSBPVExQIEhUVFAgRXhwb3J0ZXIgZm9yIERlbm9cbiAqXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgT3BlblRlbGVtZXRyeSBQcm90b2NvbCAoT1RMUCkgSFRUUCBleHBvcnRlclxuICogdGhhdCB3b3JrcyB3aXRoIERlbm8ncyBuYXRpdmUgZmV0Y2ggQVBJLlxuICovXG5cbmltcG9ydCB0eXBlIHsgVGVsZW1ldHJ5Q29uZmlnIH0gZnJvbSBcIi4vdGVsZW1ldHJ5LWNvbmZpZy50c1wiO1xuXG4vKipcbiAqIFR5cGVzIG9mIHRlbGVtZXRyeSBkYXRhIHRoYXQgY2FuIGJlIGV4cG9ydGVkXG4gKi9cbmV4cG9ydCBlbnVtIFRlbGVtZXRyeVR5cGUge1xuICBTUEFOUyA9IFwic3BhbnNcIixcbiAgTUVUUklDUyA9IFwibWV0cmljc1wiLFxuICBMT0dTID0gXCJsb2dzXCIsXG59XG5cbi8qKlxuICogU3BhbiBkYXRhIHN0cnVjdHVyZSBmb3IgT3BlblRlbGVtZXRyeVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNwYW4ge1xuICB0cmFjZUlkOiBzdHJpbmc7XG4gIHNwYW5JZDogc3RyaW5nO1xuICBwYXJlbnRTcGFuSWQ/OiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAga2luZDogbnVtYmVyO1xuICBzdGFydFRpbWVVbml4TmFubzogbnVtYmVyO1xuICBlbmRUaW1lVW5peE5hbm86IG51bWJlcjtcbiAgYXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHN0cmluZ1tdPjtcbiAgc3RhdHVzOiB7XG4gICAgY29kZTogbnVtYmVyO1xuICAgIG1lc3NhZ2U/OiBzdHJpbmc7XG4gIH07XG4gIGV2ZW50cz86IHtcbiAgICB0aW1lVW5peE5hbm86IG51bWJlcjtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgYXR0cmlidXRlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXT47XG4gIH1bXTtcbn1cblxuLyoqXG4gKiBNZXRyaWMgZGF0YSBzdHJ1Y3R1cmUgZm9yIE9wZW5UZWxlbWV0cnlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNZXRyaWMge1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICB1bml0Pzogc3RyaW5nO1xuICB0eXBlOiBcImNvdW50ZXJcIiB8IFwiZ2F1Z2VcIiB8IFwiaGlzdG9ncmFtXCI7XG4gIHZhbHVlOiBudW1iZXIgfCB7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBzdW06IG51bWJlcjtcbiAgICBidWNrZXRzOiB7XG4gICAgICBjb3VudDogbnVtYmVyO1xuICAgICAgdXBwZXJCb3VuZDogbnVtYmVyO1xuICAgIH1bXTtcbiAgfTtcbiAgYXR0cmlidXRlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXT47XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xufVxuXG4vKipcbiAqIExvZyBkYXRhIHN0cnVjdHVyZSBmb3IgT3BlblRlbGVtZXRyeVxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvZyB7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICBzZXZlcml0eU51bWJlcjogbnVtYmVyO1xuICBzZXZlcml0eVRleHQ/OiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgYXR0cmlidXRlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXT47XG4gIHRyYWNlSWQ/OiBzdHJpbmc7XG4gIHNwYW5JZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBPVExQIEhUVFAgRXhwb3J0ZXIgZm9yIHNlbmRpbmcgdGVsZW1ldHJ5IGRhdGEgdG8gYW4gT3BlblRlbGVtZXRyeSBjb2xsZWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIE9UTFBIdHRwRXhwb3J0ZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGVuZHBvaW50OiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VydmljZU5hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0QXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgcHJpdmF0ZSByZWFkb25seSBkZWJ1ZzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBPVExQIEhUVFAgZXhwb3J0ZXJcbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZyAtIFRlbGVtZXRyeSBjb25maWd1cmF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRlbGVtZXRyeUNvbmZpZykge1xuICAgIHRoaXMuZW5kcG9pbnQgPSBjb25maWcuZW5kcG9pbnQgfHwgXCJodHRwOi8vbG9jYWxob3N0OjQzMThcIjtcbiAgICB0aGlzLnNlcnZpY2VOYW1lID0gY29uZmlnLnNlcnZpY2VOYW1lIHx8IFwid29ya29zLXNka1wiO1xuICAgIHRoaXMuZGVmYXVsdEF0dHJpYnV0ZXMgPSBjb25maWcuZGVmYXVsdEF0dHJpYnV0ZXMgfHwge307XG4gICAgdGhpcy5kZWJ1ZyA9IGNvbmZpZy5kZWJ1ZyB8fCBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSByYW5kb20gSUQgZm9yIHRyYWNlIGFuZCBzcGFuIElEc1xuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgLSBOdW1iZXIgb2YgYnl0ZXMgZm9yIHRoZSBJRFxuICAgKiBAcmV0dXJucyBIZXhhZGVjaW1hbCBJRCBzdHJpbmdcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChieXRlczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFycmF5KTtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShhcnJheSlcbiAgICAgIC5tYXAoKGIpID0+IGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSlcbiAgICAgIC5qb2luKFwiXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHRyYWNlIElEICgxNiBieXRlcylcbiAgICpcbiAgICogQHJldHVybnMgVHJhY2UgSUQgc3RyaW5nXG4gICAqL1xuICBwdWJsaWMgZ2VuZXJhdGVUcmFjZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVJZCgxNik7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgc3BhbiBJRCAoOCBieXRlcylcbiAgICpcbiAgICogQHJldHVybnMgU3BhbiBJRCBzdHJpbmdcbiAgICovXG4gIHB1YmxpYyBnZW5lcmF0ZVNwYW5JZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdlbmVyYXRlSWQoOCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3J0cyBzcGFucyB0byB0aGUgT1RMUCBlbmRwb2ludFxuICAgKlxuICAgKiBAcGFyYW0gc3BhbnMgLSBBcnJheSBvZiBzcGFucyB0byBleHBvcnRcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGV4cG9ydCBpcyBjb21wbGV0ZVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGV4cG9ydFNwYW5zKHNwYW5zOiBTcGFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoc3BhbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBjb25zdCBlbnJpY2hlZFNwYW5zID0gc3BhbnMubWFwKChzcGFuKSA9PiAoe1xuICAgICAgLi4uc3BhbixcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLi4uc3Bhbi5hdHRyaWJ1dGVzLFxuICAgICAgICAuLi50aGlzLmRlZmF1bHRBdHRyaWJ1dGVzLFxuICAgICAgICBcInNlcnZpY2UubmFtZVwiOiB0aGlzLnNlcnZpY2VOYW1lLFxuICAgICAgfSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgcmVzb3VyY2VTcGFuczogW1xuICAgICAgICB7XG4gICAgICAgICAgcmVzb3VyY2U6IHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgXCJzZXJ2aWNlLm5hbWVcIjogdGhpcy5zZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgICAgLi4udGhpcy5kZWZhdWx0QXR0cmlidXRlcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzY29wZVNwYW5zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJAd29ya29zL3Nka1wiLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc3BhbnM6IGVucmljaGVkU3BhbnMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICBhd2FpdCB0aGlzLnNlbmRUZWxlbWV0cnkoVGVsZW1ldHJ5VHlwZS5TUEFOUywgcGF5bG9hZCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3J0cyBtZXRyaWNzIHRvIHRoZSBPVExQIGVuZHBvaW50XG4gICAqXG4gICAqIEBwYXJhbSBtZXRyaWNzIC0gQXJyYXkgb2YgbWV0cmljcyB0byBleHBvcnRcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGV4cG9ydCBpcyBjb21wbGV0ZVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGV4cG9ydE1ldHJpY3MobWV0cmljczogTWV0cmljW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAobWV0cmljcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IGVucmljaGVkTWV0cmljcyA9IG1ldHJpY3MubWFwKChtZXRyaWMpID0+IHtcbiAgICAgIGNvbnN0IGJhc2VNZXRyaWMgPSB7XG4gICAgICAgIG5hbWU6IG1ldHJpYy5uYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogbWV0cmljLmRlc2NyaXB0aW9uIHx8IFwiXCIsXG4gICAgICAgIHVuaXQ6IG1ldHJpYy51bml0IHx8IFwiXCIsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAuLi5tZXRyaWMuYXR0cmlidXRlcyxcbiAgICAgICAgICAuLi50aGlzLmRlZmF1bHRBdHRyaWJ1dGVzLFxuICAgICAgICAgIFwic2VydmljZS5uYW1lXCI6IHRoaXMuc2VydmljZU5hbWUsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBpZiAobWV0cmljLnR5cGUgPT09IFwiY291bnRlclwiKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uYmFzZU1ldHJpYyxcbiAgICAgICAgICBzdW06IHtcbiAgICAgICAgICAgIGRhdGFQb2ludHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRpbWVVbml4TmFubzogQmlnSW50KG1ldHJpYy50aW1lc3RhbXAgKiAxMDAwMDAwKSxcbiAgICAgICAgICAgICAgICBhc0RvdWJsZTogdHlwZW9mIG1ldHJpYy52YWx1ZSA9PT0gXCJudW1iZXJcIiA/IG1ldHJpYy52YWx1ZSA6IDAsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogYmFzZU1ldHJpYy5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGlzTW9ub3RvbmljOiB0cnVlLFxuICAgICAgICAgICAgYWdncmVnYXRpb25UZW1wb3JhbGl0eTogMSwgLy8gQUdHUkVHQVRJT05fVEVNUE9SQUxJVFlfQ1VNVUxBVElWRVxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKG1ldHJpYy50eXBlID09PSBcImdhdWdlXCIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5iYXNlTWV0cmljLFxuICAgICAgICAgIGdhdWdlOiB7XG4gICAgICAgICAgICBkYXRhUG9pbnRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aW1lVW5peE5hbm86IEJpZ0ludChtZXRyaWMudGltZXN0YW1wICogMTAwMDAwMCksXG4gICAgICAgICAgICAgICAgYXNEb3VibGU6IHR5cGVvZiBtZXRyaWMudmFsdWUgPT09IFwibnVtYmVyXCIgPyBtZXRyaWMudmFsdWUgOiAwLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGJhc2VNZXRyaWMuYXR0cmlidXRlcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSGlzdG9ncmFtXG4gICAgICBjb25zdCBoaXN0VmFsdWUgPSBtZXRyaWMudmFsdWUgYXMge1xuICAgICAgICBjb3VudDogbnVtYmVyO1xuICAgICAgICBzdW06IG51bWJlcjtcbiAgICAgICAgYnVja2V0czogeyBjb3VudDogbnVtYmVyOyB1cHBlckJvdW5kOiBudW1iZXIgfVtdO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uYmFzZU1ldHJpYyxcbiAgICAgICAgaGlzdG9ncmFtOiB7XG4gICAgICAgICAgZGF0YVBvaW50czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aW1lVW5peE5hbm86IEJpZ0ludChtZXRyaWMudGltZXN0YW1wICogMTAwMDAwMCksXG4gICAgICAgICAgICAgIGNvdW50OiBoaXN0VmFsdWUuY291bnQsXG4gICAgICAgICAgICAgIHN1bTogaGlzdFZhbHVlLnN1bSxcbiAgICAgICAgICAgICAgYnVja2V0Q291bnRzOiBoaXN0VmFsdWUuYnVja2V0cy5tYXAoKGIpID0+IGIuY291bnQpLFxuICAgICAgICAgICAgICBleHBsaWNpdEJvdW5kczogaGlzdFZhbHVlLmJ1Y2tldHMubWFwKChiKSA9PiBiLnVwcGVyQm91bmQpLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiBiYXNlTWV0cmljLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgYWdncmVnYXRpb25UZW1wb3JhbGl0eTogMSwgLy8gQUdHUkVHQVRJT05fVEVNUE9SQUxJVFlfQ1VNVUxBVElWRVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICByZXNvdXJjZU1ldHJpY3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIHJlc291cmNlOiB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgIFwic2VydmljZS5uYW1lXCI6IHRoaXMuc2VydmljZU5hbWUsXG4gICAgICAgICAgICAgIC4uLnRoaXMuZGVmYXVsdEF0dHJpYnV0ZXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2NvcGVNZXRyaWNzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJAd29ya29zL3Nka1wiLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbWV0cmljczogZW5yaWNoZWRNZXRyaWNzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5zZW5kVGVsZW1ldHJ5KFRlbGVtZXRyeVR5cGUuTUVUUklDUywgcGF5bG9hZCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3J0cyBsb2dzIHRvIHRoZSBPVExQIGVuZHBvaW50XG4gICAqXG4gICAqIEBwYXJhbSBsb2dzIC0gQXJyYXkgb2YgbG9ncyB0byBleHBvcnRcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGV4cG9ydCBpcyBjb21wbGV0ZVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGV4cG9ydExvZ3MobG9nczogTG9nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAobG9ncy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IGVucmljaGVkTG9ncyA9IGxvZ3MubWFwKChsb2cpID0+ICh7XG4gICAgICAuLi5sb2csXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIC4uLmxvZy5hdHRyaWJ1dGVzLFxuICAgICAgICAuLi50aGlzLmRlZmF1bHRBdHRyaWJ1dGVzLFxuICAgICAgICBcInNlcnZpY2UubmFtZVwiOiB0aGlzLnNlcnZpY2VOYW1lLFxuICAgICAgfSxcbiAgICB9KSk7XG5cbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgcmVzb3VyY2VMb2dzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByZXNvdXJjZToge1xuICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICBcInNlcnZpY2UubmFtZVwiOiB0aGlzLnNlcnZpY2VOYW1lLFxuICAgICAgICAgICAgICAuLi50aGlzLmRlZmF1bHRBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNjb3BlTG9nczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQHdvcmtvcy9zZGtcIixcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGxvZ1JlY29yZHM6IGVucmljaGVkTG9ncy5tYXAoKGxvZykgPT4gKHtcbiAgICAgICAgICAgICAgICB0aW1lVW5peE5hbm86IEJpZ0ludChsb2cudGltZXN0YW1wICogMTAwMDAwMCksXG4gICAgICAgICAgICAgICAgc2V2ZXJpdHlOdW1iZXI6IGxvZy5zZXZlcml0eU51bWJlcixcbiAgICAgICAgICAgICAgICBzZXZlcml0eVRleHQ6IGxvZy5zZXZlcml0eVRleHQsXG4gICAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgICAgc3RyaW5nVmFsdWU6IGxvZy5ib2R5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogT2JqZWN0LmVudHJpZXMobG9nLmF0dHJpYnV0ZXMgfHwge30pLm1hcCgoXG4gICAgICAgICAgICAgICAgICBbaywgdl0sXG4gICAgICAgICAgICAgICAgKSA9PiAoe1xuICAgICAgICAgICAgICAgICAga2V5OiBrLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nVmFsdWU6IHYudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgIHRyYWNlSWQ6IGxvZy50cmFjZUlkLFxuICAgICAgICAgICAgICAgIHNwYW5JZDogbG9nLnNwYW5JZCxcbiAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5zZW5kVGVsZW1ldHJ5KFRlbGVtZXRyeVR5cGUuTE9HUywgcGF5bG9hZCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgdGVsZW1ldHJ5IGRhdGEgdG8gdGhlIE9UTFAgZW5kcG9pbnRcbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUeXBlIG9mIHRlbGVtZXRyeSBkYXRhXG4gICAqIEBwYXJhbSBwYXlsb2FkIC0gRGF0YSBwYXlsb2FkXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBkYXRhIGlzIHNlbnRcbiAgICogQHRocm93cyBFcnJvciBpZiB0aGUgZXhwb3J0IGZhaWxzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbmRUZWxlbWV0cnkoXG4gICAgdHlwZTogVGVsZW1ldHJ5VHlwZSxcbiAgICBwYXlsb2FkOiB1bmtub3duLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmVuZHBvaW50fS92MS8ke3R5cGV9YDtcblxuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbV29ya09TIFRlbGVtZXRyeV0gRXhwb3J0aW5nICR7dHlwZX0gdG8gJHt1cmx9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBbV29ya09TIFRlbGVtZXRyeV0gRXJyb3IgZXhwb3J0aW5nICR7dHlwZX06ICR7cmVzcG9uc2Uuc3RhdHVzfSAke2Vycm9yVGV4dH1gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBbV29ya09TIFRlbGVtZXRyeV0gU3VjY2Vzc2Z1bGx5IGV4cG9ydGVkICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1dvcmtPUyBUZWxlbWV0cnldIEZhaWxlZCB0byBleHBvcnQgJHt0eXBlfTpgLCBlcnJvcik7XG4gICAgICB9XG4gICAgICAvLyBXZSBkb24ndCB3YW50IHRvIHRocm93IGVycm9ycyBmcm9tIHRlbGVtZXRyeSB0byBhdm9pZCBicmVha2luZyB0aGUgYXBwbGljYXRpb25cbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Q0FLQyxHQUlEOztDQUVDLEdBQ0QsT0FBTyxJQUFBLEFBQUssdUNBQUE7Ozs7U0FBQTtNQUlYO0FBMEREOztDQUVDLEdBQ0QsT0FBTyxNQUFNO0VBQ00sU0FBaUI7RUFDakIsWUFBb0I7RUFDcEIsa0JBQTBDO0VBQzFDLE1BQWU7RUFFaEM7Ozs7R0FJQyxHQUNELFlBQVksTUFBdUIsQ0FBRTtJQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sUUFBUSxJQUFJO0lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxXQUFXLElBQUk7SUFDekMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8saUJBQWlCLElBQUksQ0FBQztJQUN0RCxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sS0FBSyxJQUFJO0VBQy9CO0VBRUE7Ozs7O0dBS0MsR0FDRCxBQUFRLFdBQVcsS0FBYSxFQUFVO0lBQ3hDLE1BQU0sUUFBUSxJQUFJLFdBQVc7SUFDN0IsT0FBTyxlQUFlLENBQUM7SUFDdkIsT0FBTyxNQUFNLElBQUksQ0FBQyxPQUNmLEdBQUcsQ0FBQyxDQUFDLElBQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxNQUN0QyxJQUFJLENBQUM7RUFDVjtFQUVBOzs7O0dBSUMsR0FDRCxBQUFPLGtCQUEwQjtJQUMvQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7RUFDekI7RUFFQTs7OztHQUlDLEdBQ0QsQUFBTyxpQkFB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
// denoCacheMetadata=9671550203686507322,11852383600342357816
