import type { RequestException } from '../interfaces/request-exception.interface.ts';

export class BadRequestException extends Error implements RequestException {
  readonly status = 400;
  override readonly name = 'BadRequestException';
  override readonly message: string = 'Bad request';
  readonly code?: string;
  readonly errors?: unknown[];
  readonly requestID: string;

  constructor({
    code,
    errors,
    message,
    requestID,
  }: {
    code?: string;
    errors?: unknown[];
    message?: string;
    requestID: string;
  }) {
    super();

    this.requestID = requestID;

    if (message) {
      this.message = message;
    }

    if (code) {
      this.code = code;
    }

    if (errors) {
      this.errors = errors;
    }
  }
}
