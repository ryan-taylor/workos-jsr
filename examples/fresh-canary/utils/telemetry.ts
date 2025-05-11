// Simplified telemetry implementation for Fresh application

// Service information
export const SERVICE_NAME = 'fresh-canary';
export const SERVICE_VERSION = '1.0.0';
export const ENVIRONMENT = Deno.env.get('DENO_ENV') || 'development';

// Storage for metrics and spans
type MetricValue = {
  value: number;
  timestamp: number;
  attributes: Record<string, string>;
};

type Span = {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string>;
  status: 'OK' | 'ERROR';
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, string>;
  }>;
  error?: Error;
};

// In-memory storage
const metrics: Record<string, MetricValue[]> = {};
const spans: Span[] = [];

/**
 * Create and track a span for measuring operation performance
 */
export async function createSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  attributes: Record<string, string> = {},
): Promise<T> {
  const span: Span = {
    name,
    startTime: performance.now(),
    attributes,
    status: 'OK',
    events: [],
  };

  try {
    // Execute the operation
    const result = await fn(span);
    span.status = 'OK';
    return result;
  } catch (error) {
    // Record error information
    span.status = 'ERROR';
    span.error = error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally {
    // Finalize the span
    span.endTime = performance.now();
    spans.push(span);

    // Also record as a duration metric
    const duration = span.endTime - span.startTime;
    recordMetric(`${name}_duration`, duration, attributes);
  }
}

/**
 * Record a metric with the specified value and attributes
 */
export function recordMetric(
  name: string,
  value: number,
  attributes: Record<string, string> = {},
): void {
  if (!metrics[name]) {
    metrics[name] = [];
  }

  metrics[name].push({
    value,
    timestamp: Date.now(),
    attributes,
  });

  // Debug logging in development
  if (ENVIRONMENT === 'development') {
    console.log(`METRIC [${name}]: ${value}`, attributes);
  }
}

/**
 * Format all metrics in Prometheus exposition format
 */
export function formatMetricsAsPrometheus(): string {
  const lines: string[] = [];

  for (const [name, values] of Object.entries(metrics)) {
    if (values.length === 0) continue;

    // Add metric type header (counters or histograms)
    const isHistogram = name.includes('_duration') || name.includes('_time');
    lines.push(`# TYPE ${name} ${isHistogram ? 'histogram' : 'counter'}`);
    lines.push(`# HELP ${name} ${name.replace(/_/g, ' ')}`);

    if (isHistogram) {
      // Group metrics by attribute sets
      const groupedMetrics: Record<string, number[]> = {};

      for (const metricValue of values) {
        const attrKey = JSON.stringify(metricValue.attributes);
        if (!groupedMetrics[attrKey]) {
          groupedMetrics[attrKey] = [];
        }
        groupedMetrics[attrKey].push(metricValue.value);
      }

      // Calculate histogram stats for each group
      for (const [attrKey, metricValues] of Object.entries(groupedMetrics)) {
        const attributes = JSON.parse(attrKey);
        const sum = metricValues.reduce((a, b) => a + b, 0);
        const count = metricValues.length;

        // Get attribute string
        const attrString = formatLabels(attributes);

        // Output sum and count
        lines.push(`${name}_sum${attrString} ${sum}`);
        lines.push(`${name}_count${attrString} ${count}`);

        // Calculate and output percentile buckets
        // Simplified buckets for response time: 10, 50, 100, 200, 500, 1000, +Inf
        const buckets = [10, 50, 100, 200, 500, 1000];

        for (const bucketLimit of buckets) {
          const bucketCount = metricValues.filter((v) => v <= bucketLimit).length;
          lines.push(`${name}_bucket${formatLabels({ ...attributes, le: bucketLimit.toString() })} ${bucketCount}`);
        }

        // Add infinity bucket (all values)
        lines.push(`${name}_bucket${formatLabels({ ...attributes, le: '+Inf' })} ${count}`);
      }
    } else {
      // Handle counters - sum by attribute sets
      const sums: Record<string, { sum: number; attrs: Record<string, string> }> = {};

      for (const metricValue of values) {
        const attrKey = JSON.stringify(metricValue.attributes);
        if (!sums[attrKey]) {
          sums[attrKey] = { sum: 0, attrs: metricValue.attributes };
        }
        sums[attrKey].sum += metricValue.value;
      }

      // Output counter metrics
      for (const { sum, attrs } of Object.values(sums)) {
        lines.push(`${name}${formatLabels(attrs)} ${sum}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format metric labels according to Prometheus format
 */
function formatLabels(labels: Record<string, string>): string {
  if (Object.keys(labels).length === 0) {
    return '';
  }

  const labelPairs = Object.entries(labels)
    .map(([key, value]) => `${key}="${escapeValue(value)}"`)
    .join(',');

  return `{${labelPairs}}`;
}

/**
 * Escape special characters in label values
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');
}

/**
 * Measure the execution time of a function and record it as a metric
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T> | T,
  attributes: Record<string, string> = {},
): Promise<T> {
  const startTime = performance.now();
  try {
    return await fn();
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    recordMetric(name, duration, attributes);
  }
}

// Export additional utility functions
export function clearMetrics(): void {
  for (const key of Object.keys(metrics)) {
    delete metrics[key];
  }
  spans.length = 0;
}

export function getMetrics(): Record<string, MetricValue[]> {
  return { ...metrics };
}

export function getSpans(): Span[] {
  return [...spans];
}
