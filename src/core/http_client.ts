export class HttpClientError extends Error {
  status?: number;
  response?: Response;
  constructor(message: string, status?: number, response?: Response) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.response = response;
  }
}

export interface HttpRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
}

export class HttpClient {
  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', headers, body, signal } = options;
    let fetchBody: BodyInit | undefined;
    let fetchHeaders = new Headers(headers);

    if (body !== undefined) {
      fetchBody = JSON.stringify(body);
      fetchHeaders.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: fetchBody,
        signal,
      });
    } catch (err) {
      throw new HttpClientError(`Network error: ${err.message}`);
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = response.statusText;
      }
      throw new HttpClientError(
        `HTTP ${response.status}: ${errorText}`,
        response.status,
        response,
      );
    }

    // Try to parse JSON, fallback to text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      // @ts-ignore: T may not be string, but fallback for non-JSON
      return (await response.text()) as T;
    }
  }
} 