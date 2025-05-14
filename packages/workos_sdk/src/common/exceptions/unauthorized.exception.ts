import type { RequestException } from "../interfaces/request-exception.interface.ts";

export class UnauthorizedException extends Error implements RequestException {
  readonly status = 401;
  override readonly name = "UnauthorizedException";
  override readonly message: string;

  constructor(readonly requestID: string) {
    super();
    this.message =
      `Could not authorize the request. Maybe your API key is invalid?`;
  }
}
