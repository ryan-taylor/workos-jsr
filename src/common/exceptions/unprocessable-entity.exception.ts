import { plural } from "https://deno.land/x/deno_plural@2.0.0/mod.ts";

import type { UnprocessableEntityError } from '../interfaces/unprocessable-entity-error.interface.ts.ts';
import type { RequestException } from '../interfaces/request-exception.interface.ts.ts';

export class UnprocessableEntityException extends Error implements RequestException {
  readonly status = 422;
  override readonly name = 'UnprocessableEntityException';
  override readonly message: string = 'Unprocessable entity';
  readonly code?: string;
  readonly requestID: string;

  constructor({
    code,
    errors,
    message,
    requestID,
  }: {
    code?: string;
    errors?: UnprocessableEntityError[];
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
      const requirement: string = errors.length === 1 ? 'requirement' : plural('requirement');

      this.message = `The following ${requirement} must be met:\n`;

      for (const { code } of errors) {
        this.message = this.message.concat(`\t${code}\n`);
      }
    }
  }
}
