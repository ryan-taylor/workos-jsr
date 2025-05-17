/**
 * Prometheus Exporter for WorkOS Telemetry
 * 
 * This module provides utilities for formatting telemetry metrics in Prometheus exposition format
 * and handling HTTP requests from Prometheus scrapers.
 */

import { Metric, MetricType, HistogramValue } from "../telemetry.ts";

/**
 * Format metrics in Prometheus exposition format
 * 
 * @param metrics The metrics to format
 * @returns A string in Prometheus exposition format
 */
export function formatMetricsAsPrometheus(metrics: Metric[]): string {
  const lines: string[] = [];
  const groupedMetrics = groupMetricsByName(metrics);
  
  // Process each metric group
  for (const [name, groupInfo] of groupedMetrics.entries()) {
    const { type, description, metrics: metricsInGroup } = groupInfo;
    
    // Add metric description as a comment
    if (description) {
      lines.push(`# HELP ${name} ${escapeHelp(description)}`);
    }
    
    // Add metric type
    lines.push(`# TYPE ${name} ${mapMetricType(type)}`);
    
    // Add each metric point
    for (const metric of metricsInGroup) {
      if (type === MetricType.HISTOGRAM) {
        // For histograms, we need to add multiple lines
        addHistogramMetric(lines, metric);
      } else {
        // For counters and gauges, add a single line
        addSimpleMetric(lines, metric);
      }
    }
  }
  
  return lines.join("\n");
}

/**
 * Creates an HTTP handler function for serving Prometheus metrics
 * 
 * @param getMetrics A function that returns the metrics to format
 * @returns An HTTP handler function
 */
export function createPrometheusHandler(
  getMetrics: () => Promise<Metric[]> | Metric[],
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      // Get metrics
      const metrics = await getMetrics();
      
      // Format metrics in Prometheus exposition format
      const formatted = formatMetricsAsPrometheus(metrics);
      
      // Return formatted metrics
      return new Response(formatted, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error) {
      console.error("Error serving Prometheus metrics:", error);
      
      return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  };
}

/**
 * Group metrics by name for easier processing
 * 
 * @param metrics The metrics to group
 * @returns A map of metric names to their type, description, and values
 */
function groupMetricsByName(metrics: Metric[]): Map<string, { 
  type: MetricType; 
  description?: string; 
  unit?: string;
  metrics: Metric[];
}> {
  const metricsByName = new Map<string, { 
    type: MetricType; 
    description?: string;
    unit?: string;
    metrics: Metric[];
  }>();
  
  for (const metric of metrics) {
    const { name, type, description, unit } = metric;
    
    if (!metricsByName.has(name)) {
      metricsByName.set(name, { 
        type, 
        description, 
        unit,
        metrics: [metric],
      });
    } else {
      metricsByName.get(name)?.metrics.push(metric);
    }
  }
  
  return metricsByName;
}

/**
 * Add a counter or gauge metric to the output lines
 * 
 * @param lines The output lines to append to
 * @param metric The metric to add
 */
function addSimpleMetric(lines: string[], metric: Metric): void {
  const { name, value, attributes } = metric;
  
  // Skip if value is not a number (e.g., histogram)
  if (typeof value !== "number") {
    return;
  }
  
  // Format the metric line
  const nameSuffix = metric.type === MetricType.COUNTER ? "_total" : "";
  const metricName = `${name}${nameSuffix}`;
  const labels = formatLabels(attributes || {});
  
  lines.push(`${metricName}${labels} ${value}`);
}

/**
 * Add a histogram metric to the output lines
 * 
 * @param lines The output lines to append to
 * @param metric The histogram metric to add
 */
function addHistogramMetric(lines: string[], metric: Metric): void {
  const { name, value, attributes } = metric;
  
  // Skip if value is not a histogram
  if (typeof value === "number") {
    return;
  }
  
  const histogramValue = value as HistogramValue;
  const labels = attributes || {};
  
  // Add bucket lines
  for (const bucket of histogramValue.buckets) {
    const bucketLabels = {
      ...labels,
      le: String(bucket.upperBound),
    };
    
    const formattedLabels = formatLabels(bucketLabels);
    lines.push(`${name}_bucket${formattedLabels} ${bucket.count}`);
  }
  
  // Add +Inf bucket
  const infLabels = {
    ...labels,
    le: "+Inf",
  };
  
  const formattedInfLabels = formatLabels(infLabels);
  lines.push(`${name}_bucket${formattedInfLabels} ${histogramValue.count}`);
  
  // Add sum and count
  const formattedLabels = formatLabels(labels);
  lines.push(`${name}_sum${formattedLabels} ${histogramValue.sum}`);
  lines.push(`${name}_count${formattedLabels} ${histogramValue.count}`);
}

/**
 * Format metric labels as a Prometheus label string
 * 
 * @param labels The labels to format
 * @returns A formatted label string, or an empty string if no labels
 */
function formatLabels(labels: Record<string, string | number | boolean>): string {
  if (Object.keys(labels).length === 0) {
    return "";
  }
  
  const labelPairs = Object.entries(labels)
    .map(([key, value]) => `${escapeLabel(key)}="${escapeValue(String(value))}"`)
    .join(",");
  
  return `{${labelPairs}}`;
}

/**
 * Map metric type to Prometheus type
 * 
 * @param type The metric type
 * @returns The Prometheus metric type
 */
function mapMetricType(type: MetricType): string {
  switch (type) {
    case MetricType.COUNTER:
      return "counter";
    case MetricType.GAUGE:
      return "gauge";
    case MetricType.HISTOGRAM:
      return "histogram";
    default:
      return "untyped";
  }
}

/**
 * Escape help text for Prometheus exposition format
 * 
 * @param text The text to escape
 * @returns The escaped text
 */
function escapeHelp(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
}

/**
 * Escape label name for Prometheus exposition format
 * 
 * @param label The label name to escape
 * @returns The escaped label name
 */
function escapeLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escape label value for Prometheus exposition format
 * 
 * @param value The label value to escape
 * @returns The escaped label value
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}