import type {
  HttpClientInterface,
  HttpClientResponseInterface,
  RequestHeaders,
  RequestOptions,
  ResponseHeaders,
} from "../interfaces/http-client.interface.ts";
import type { JsonValue } from "../interfaces/http-response.interface.ts";
import {
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "./http-client.ts";

export class FetchHttpClient extends HttpClient implements HttpClientInterface {
  private readonly _fetchFn;

  constructor(
    override readonly baseURL: string,
    override readonly options?: RequestInit,
    fetchFn?: typeof fetch,
  ) {
    super(baseURL, options);

    // Default to global fetch if available
    if (!fetchFn) {
      if (!globalThis.fetch) {
        throw new Error(
          "Fetch function not defined in the global scope and no replacement was provided.",
        );
      }
      fetchFn = globalThis.fetch;
    }

    this._fetchFn = fetchFn.bind(globalThis);
  }

  /** @override */
  override getClientName(): string {
    return "fetch";
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

    if (path.startsWith("/fga/")) {
      return await this.fetchRequestWithRetry(
        resourceURL,
        "GET",
        null,
        options.headers,
      );
    } else {
      return await this.fetchRequest(resourceURL, "GET", null, options.headers);
    }
  }

  async post<Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    if (path.startsWith("/fga/")) {
      return await this.fetchRequestWithRetry(
        resourceURL,
        "POST",
        HttpClient.getBody(entity),
        {
          ...HttpClient.getContentTypeHeader(entity),
          ...options.headers,
        },
      );
    } else {
      return await this.fetchRequest(
        resourceURL,
        "POST",
        HttpClient.getBody(entity),
        {
          ...HttpClient.getContentTypeHeader(entity),
          ...options.headers,
        },
      );
    }
  }

  async put<Entity = unknown>(
    path: string,
    entity: Entity,
    options: RequestOptions,
  ): Promise<HttpClientResponseInterface> {
    const resourceURL = HttpClient.getResourceURL(
      this.baseURL,
      path,
      options.params,
    );

    if (path.startsWith("/fga/")) {
      return await this.fetchRequestWithRetry(
        resourceURL,
        "PUT",
        HttpClient.getBody(entity),
        {
          ...HttpClient.getContentTypeHeader(entity),
          ...options.headers,
        },
      );
    } else {
      return await this.fetchRequest(
        resourceURL,
        "PUT",
        HttpClient.getBody(entity),
        {
          ...HttpClient.getContentTypeHeader(entity),
          ...options.headers,
        },
      );
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

    if (path.startsWith("/fga/")) {
      return await this.fetchRequestWithRetry(
        resourceURL,
        "DELETE",
        null,
        options.headers,
      );
    } else {
      return await this.fetchRequest(
        resourceURL,
        "DELETE",
        null,
        options.headers,
      );
    }
  }

  private async fetchRequest(
    url: string,
    method: string,
    body?: BodyInit | null | undefined,
    headers?: RequestHeaders,
  ): Promise<HttpClientResponseInterface> {
    // For methods which expect payloads, we should always pass a body value
    // even when it is empty. Without this, some JS runtimes (eg. Deno) will
    // inject a second Content-Length header.
    const methodHasPayload = method === "POST" || method === "PUT" ||
      method === "PATCH";

    const requestBody = body || (methodHasPayload ? "" : undefined);

    const { "User-Agent": userAgent } = this.options?.headers as RequestHeaders;

    const res = await this._fetchFn(url, {
      method,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        ...this.options?.headers,
        ...headers,
        "User-Agent": this.addClientToUserAgent(userAgent.toString()),
      },
      body: requestBody,
    });

    if (!res.ok) {
      throw new HttpClientError({
        message: res.statusText,
        response: {
          status: res.status,
          headers: FetchHttpClientResponse._transformHeadersToObject(
            res.headers,
          ),
          data: await res.json(),
        },
      });
    }

    return new FetchHttpClientResponse(res);
  }

  private async fetchRequestWithRetry(
    url: string,
    method: string,
    body?: BodyInit | null | undefined,
    headers?: RequestHeaders,
  ): Promise<HttpClientResponseInterface> {
    let response: HttpClientResponseInterface;
    let retryAttempts = 1;

    const makeRequest = async (): Promise<HttpClientResponseInterface> => {
      let requestError: Error | HttpClientError<unknown> | null = null;

      try {
        response = await this.fetchRequest(url, method, body, headers);
      } catch (e) {
        if (e instanceof Error || e instanceof HttpClientError) {
          requestError = e;
        } else {
          requestError = new Error(String(e));
        }
      }

      if (this.shouldRetryRequest(requestError, retryAttempts)) {
        retryAttempts++;
        await this.sleep(retryAttempts);
        return makeRequest();
      }

      if (requestError != null) {
        throw requestError;
      }

      return response;
    };

    return makeRequest();
  }

  private shouldRetryRequest(
    requestError: Error | HttpClientError<unknown> | null,
    retryAttempt: number,
  ): boolean {
    if (retryAttempt > this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    if (requestError != null) {
      if (requestError instanceof TypeError) {
        return true;
      }

      if (
        requestError instanceof HttpClientError &&
        this.RETRY_STATUS_CODES.includes(requestError.response.status)
      ) {
        return true;
      }
    }

    return false;
  }
}

// tslint:disable-next-line
export class FetchHttpClientResponse extends HttpClientResponse
  implements HttpClientResponseInterface {
  _res: Response;

  constructor(res: Response) {
    super(
      res.status,
      FetchHttpClientResponse._transformHeadersToObject(res.headers),
    );
    this._res = res;
  }

  getRawResponse(): Response {
    return this._res;
  }

  toJSON(): Promise<JsonValue> | null {
    const contentType = this._res.headers.get("content-type");
    const isJsonResponse = contentType?.includes("application/json");

    return isJsonResponse ? this._res.json() : null;
  }

  static _transformHeadersToObject(headers: Headers): ResponseHeaders {
    // Fetch uses a Headers instance so this must be converted to a barebones
    // JS object to meet the HttpClient interface.
    const headersObj: { [key: string]: string } = {};

    // Use forEach to iterate through headers which is more reliable
    headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    return headersObj as ResponseHeaders;
  }
}
