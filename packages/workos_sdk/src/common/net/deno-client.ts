import type {
  HttpClientInterface,
  HttpClientResponseInterface,
  RequestHeaders,
  RequestOptions,
  ResponseHeaders,
} from "workos/common/interfaces/http-client.interface.ts";
import {
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "workos/common/net/http-client.ts";

/**
 * HTTP client implementation for Deno runtime
 * Uses Deno's native fetch API
 */
export class DenoHttpClient extends HttpClient implements HttpClientInterface {
  constructor(
    override readonly baseURL: string,
    override readonly options?: RequestInit,
  ) {
    super(baseURL, options);
  }

  /** @override */
  override getClientName(): string {
    return "deno";
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
    body?: BodyInit | null,
    headers?: RequestHeaders,
  ): Promise<HttpClientResponseInterface> {
    // For methods which expect payloads, we should always pass a body value
    // even when it is empty. Without this, some JS runtimes (eg. Deno) will
    // inject a second Content-Length header.
    const methodHasPayload = method === "POST" || method === "PUT" ||
      method === "PATCH";
    const requestBody = body || (methodHasPayload ? "" : undefined);

    const { "User-Agent": userAgent } =
      this.options?.headers as RequestHeaders || {};
    const userAgentValue = userAgent
      ? this.addClientToUserAgent(userAgent.toString())
      : `workos-deno/${this.getClientName()}`;

    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        ...this.options?.headers,
        ...headers,
        "User-Agent": userAgentValue,
      },
      body: requestBody,
    });

    if (!res.ok) {
      throw new HttpClientError({
        message: res.statusText,
        response: {
          status: res.status,
          headers: DenoHttpClientResponse._transformHeadersToObject(
            res.headers,
          ),
          data: await res.json(),
        },
      });
    }

    return new DenoHttpClientResponse(res);
  }

  private async fetchRequestWithRetry(
    url: string,
    method: string,
    body?: BodyInit | null,
    headers?: RequestHeaders,
  ): Promise<HttpClientResponseInterface> {
    let response: HttpClientResponseInterface;
    let retryAttempts = 1;

    const makeRequest = async (): Promise<HttpClientResponseInterface> => {
      let requestError: any = null;

      try {
        response = await this.fetchRequest(url, method, body, headers);
      } catch (e) {
        requestError = e;
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

  private shouldRetryRequest(requestError: any, retryAttempt: number): boolean {
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

/**
 * HTTP client response implementation for Deno runtime
 */
export class DenoHttpClientResponse extends HttpClientResponse
  implements HttpClientResponseInterface {
  _res: Response;

  constructor(res: Response) {
    super(
      res.status,
      DenoHttpClientResponse._transformHeadersToObject(res.headers),
    );
    this._res = res;
  }

  getRawResponse(): Response {
    return this._res;
  }

  async toJSON(): Promise<any> {
    const contentType = this._res.headers.get("content-type");
    const isJsonResponse = contentType?.includes("application/json");

    return isJsonResponse ? await this._res.json() : null;
  }

  static _transformHeadersToObject(headers: Headers): ResponseHeaders {
    const headersObj: ResponseHeaders = {};

    // Deno's Headers implementation is iterable
    for (const [key, value] of headers.entries()) {
      headersObj[key] = value;
    }

    return headersObj;
  }
}
