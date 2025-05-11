import type { AppInfo } from './app-info.interface.ts.ts';
import type { TelemetryConfig } from '../../telemetry/telemetry-config.ts.ts';

export interface WorkOSOptions {
  apiHostname?: string;
  https?: boolean;
  port?: number;
  config?: RequestInit;
  appInfo?: AppInfo;
  fetchFn?: typeof fetch;
  clientId?: string;
  /**
   * Telemetry configuration options.
   *
   * You can enable telemetry to collect metrics on SDK usage
   * and performance, which can be sent to an OpenTelemetry collector.
   *
   * @example
   * ```ts
   * const workos = new WorkOS(apiKey, {
   *   telemetry: {
   *     enabled: true,
   *     endpoint: 'http://localhost:4318',
   *     serviceName: 'my-application',
   *   }
   * });
   * ```
   */
  telemetry?: Partial<TelemetryConfig>;
}
