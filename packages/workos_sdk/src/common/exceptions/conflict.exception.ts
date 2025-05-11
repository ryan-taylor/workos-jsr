import type { RequestException } from '../interfaces/request-exception.interface.ts';

export class ConflictException extends Error implements RequestException {
  readonly status = 409;
  override readonly name = 'ConflictException';
  override readonly message: string;
  readonly requestID: string;

  constructor({
    error,
    message,
    requestID,
  }: {
    error?: string;
    message?: string;
    requestID: string;
  }) {
    super();

    this.requestID = requestID;

    if (message) {
      this.message = message;
    } else if (error) {
      this.message = `Error: ${error}`;
    } else {
      this.message = `An conflict has occurred on the server.`;
    }
  }
}
