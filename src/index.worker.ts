import { WorkOS as BaseWorkOS } from './workos.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import type { HttpClient } from './common/net/http-client.ts';
import type { WorkOSOptions } from './common/interfaces/workos-options.interface.ts';

export class WorkOS extends BaseWorkOS {
  override createHttpClient(options: WorkOSOptions, userAgent: string): HttpClient {
    const headers = {
      ...options.config?.headers,
      Authorization: `Bearer ${this.key}`,
      'User-Agent': userAgent,
    };
    // Always use FetchHttpClient in worker environment
    return new FetchHttpClient(this.baseURL, { ...options.config, headers }) as unknown as HttpClient;
  }
} 