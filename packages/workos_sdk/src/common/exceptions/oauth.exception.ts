import type { RequestException } from "workos/common/interfaces/request-exception.interface.ts";

export class OauthException extends Error implements RequestException {
  override readonly name = "OauthException";
  override readonly message: string;

  constructor(
    readonly status: number,
    readonly requestID: string,
    readonly error: string | undefined,
    readonly errorDescription: string | undefined,
    readonly rawData: unknown,
  ) {
    super();
    if (error && errorDescription) {
      this.message = `Error: ${error}\nError Description: ${errorDescription}`;
    } else if (error) {
      this.message = `Error: ${error}`;
    } else {
      this.message = `An error has occurred.`;
    }
  }
}
