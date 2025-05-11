import type { RequestException } from "../interfaces/request-exception.interface.ts";

export class GenericServerException extends Error implements RequestException {
  override readonly name: string = "GenericServerException";
  override readonly message: string = "The request could not be completed.";

  constructor(
    readonly status: number,
    message: string | undefined,
    readonly rawData: unknown,
    readonly requestID: string,
  ) {
    super();
    if (message) {
      this.message = message;
    }
  }
}
