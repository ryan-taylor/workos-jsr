import { WorkOS as BaseWorkOS } from "./workos.ts";
import { FetchHttpClient } from "./common/net/fetch-client.ts";
import type { HttpClient } from "./common/net/http-client.ts";
import type { WorkOSOptions } from "./common/interfaces/workos-options.interface.ts";

// Define an interface for the expected properties
interface WorkOSWithProperties {
  key: string;
  baseURL: string;
}

export class WorkOS extends BaseWorkOS {
  createHttpClient(
    options: WorkOSOptions,
    userAgent: string,
  ): HttpClient {
    // Cast this to the interface with the required properties
    const self = this as unknown as WorkOSWithProperties;
    
    const headers = {
      ...options.config?.headers,
      Authorization: `Bearer ${self.key}`,
      "User-Agent": userAgent,
    };
    // Always use FetchHttpClient in worker environment
    return new FetchHttpClient(self.baseURL, {
      ...options.config,
      headers,
    }) as unknown as HttpClient;
  }
}
