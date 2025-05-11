export class WorkOSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkOSError';
  }
}

export { HttpClientError } from './http_client.ts.ts';
