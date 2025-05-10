import { HttpClient, HttpClientError, HttpClientResponse } from './http-client.ts.ts';
import {
  HttpClientInterface,
  HttpClientResponseInterface,
  RequestHeaders,
  RequestOptions,
  ResponseHeaders,
} from '../interfaces/http-client.interface.ts.ts';

export class DenoHttpClient extends HttpClient implements HttpClientInterface {
  constructor(override readonly baseURL: string, override readonly options?: RequestInit) {
    super(baseURL, options);
  }

  override getClientName(): string {
    return 'deno';
  }

  static override getBody(entity: unknown): string | null | FormData {
    if (entity === null || entity === undefined) {
      return null;
    }

    if (entity instanceof URLSearchParams || entity instanceof FormData) {
      return entity;
    }

    return JSON.stringify(entity);
  }

  /**
   * Helper method to convert RequestHeaders to HeadersInit
   */
  private convertHeaders(headers?: RequestHeaders): HeadersInit | undefined {
    if (!headers) return undefined;
    // Cast RequestHeaders to Record<string, string> as HeadersInit
    return headers as Record<string, string>;
  }

  async get(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    if (path.startsWith('/fga/')) {
      return await this.fetchWithRetry(resourceURL, {
        method: 'GET',
        headers: this.convertHeaders(options.headers),
      });
    } else {
      return await this.fetch(resourceURL, {
        method: 'GET',
        headers: this.convertHeaders(options.headers),
      });
    }
  }

  async post<Entity = any>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    const contentTypeHeader = HttpClient.getContentTypeHeader(entity);
    const combinedHeaders = {
      ...contentTypeHeader,
      ...options.headers,
    };

    if (path.startsWith('/fga/')) {
      return await this.fetchWithRetry(resourceURL, {
        method: 'POST',
        headers: this.convertHeaders(combinedHeaders),
        body: DenoHttpClient.getBody(entity),
      });
    } else {
      return await this.fetch(resourceURL, {
        method: 'POST',
        headers: this.convertHeaders(combinedHeaders),
        body: DenoHttpClient.getBody(entity),
      });
    }
  }

  async put<Entity = any>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    const contentTypeHeader = HttpClient.getContentTypeHeader(entity);
    const combinedHeaders = {
      ...contentTypeHeader,
      ...options.headers,
    };

    if (path.startsWith('/fga/')) {
      return await this.fetchWithRetry(resourceURL, {
        method: 'PUT',
        headers: this.convertHeaders(combinedHeaders),
        body: DenoHttpClient.getBody(entity),
      });
    } else {
      return await this.fetch(resourceURL, {
        method: 'PUT',
        headers: this.convertHeaders(combinedHeaders),
        body: DenoHttpClient.getBody(entity),
      });
    }
  }

  async delete(
    path: string,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    if (path.startsWith('/fga/')) {
      return await this.fetchWithRetry(resourceURL, {
        method: 'DELETE',
        headers: this.convertHeaders(options.headers),
      });
    } else {
      return await this.fetch(resourceURL, {
        method: 'DELETE',
        headers: this.convertHeaders(options.headers),
      });
    }
  }

  private async fetch(
    url: string,
    init: RequestInit,
  ): Promise<HttpClientResponseInterface> {
    const { 'User-Agent': userAgent } = (this.options?.headers as RequestHeaders) || {};
    
    // Convert options headers to HeadersInit
    const baseHeaders = this.convertHeaders(this.options?.headers as RequestHeaders) || {};
    
    // Merge headers properly
    const headers: HeadersInit = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      ...baseHeaders,
      ...(init.headers || {}),
    };
    
    // Add User-Agent if available
    if (userAgent) {
      headers['User-Agent'] = this.addClientToUserAgent(userAgent.toString());
    }
    
    const fetchOptions: RequestInit = {
      ...init,
      headers,
    };

    try {
      const response = await fetch(url, fetchOptions);
      const clientResponse = new DenoHttpClientResponse(response);

      if (response.status < 200 || response.status > 299) {
        const responseData = await clientResponse.toJSON();
        throw new HttpClientError({
          message: response.statusText,
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData,
          },
        });
      }

      return clientResponse;
    } catch (error) {
      if (error instanceof HttpClientError) {
        throw error;
      }
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
  ): Promise<HttpClientResponseInterface> {
    const { 'User-Agent': userAgent } = (this.options?.headers as RequestHeaders) || {};
    
    // Convert options headers to HeadersInit
    const baseHeaders = this.convertHeaders(this.options?.headers as RequestHeaders) || {};
    
    // Merge headers properly
    const headers: HeadersInit = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      ...baseHeaders,
      ...(init.headers || {}),
    };
    
    // Add User-Agent if available
    if (userAgent) {
      headers['User-Agent'] = this.addClientToUserAgent(userAgent.toString());
    }
    
    const fetchOptions: RequestInit = {
      ...init,
      headers,
    };

    let retryAttempts = 1;

    const makeRequest = async (): Promise<HttpClientResponseInterface> => {
      try {
        const response = await fetch(url, fetchOptions);
        const clientResponse = new DenoHttpClientResponse(response);

        if (this.shouldRetryRequest(response, retryAttempts)) {
          retryAttempts++;
          await this.sleep(retryAttempts);
          return makeRequest();
        }

        if (response.status < 200 || response.status > 299) {
          const responseData = await clientResponse.toJSON();
          throw new HttpClientError({
            message: response.statusText,
            response: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              data: responseData,
            },
          });
        }

        return clientResponse;
      } catch (error) {
        if (error instanceof TypeError && retryAttempts <= this.MAX_RETRY_ATTEMPTS) {
          retryAttempts++;
          await this.sleep(retryAttempts);
          return makeRequest();
        }

        if (error instanceof HttpClientError) {
          throw error;
        }
        
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    };

    return makeRequest();
  }

  private shouldRetryRequest(response: Response, retryAttempt: number): boolean {
    if (retryAttempt > this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    if (response && this.RETRY_STATUS_CODES.includes(response.status)) {
      return true;
    }

    return false;
  }
}

export class DenoHttpClientResponse
  extends HttpClientResponse
  implements HttpClientResponseInterface
{
  _res: Response;

  constructor(res: Response) {
    const headers: ResponseHeaders = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    super(res.status, headers);
    this._res = res;
  }

  getRawResponse(): Response {
    return this._res;
  }

  async toJSON(): Promise<any> {
    const contentType = this._res.headers.get('content-type');
    const isJsonResponse = contentType?.includes('application/json');

    if (!isJsonResponse) {
      return null;
    }

    try {
      const text = await this._res.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      throw e;
    }
  }
}