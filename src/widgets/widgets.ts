import type { WorkOS } from '../workos.ts.ts';
import {
  deserializeGetTokenResponse,
  type GetTokenOptions,
  type GetTokenResponseResponse,
  type SerializedGetTokenOptions,
  serializeGetTokenOptions,
} from './interfaces/get-token.ts.ts';

export class Widgets {
  constructor(private readonly workos: WorkOS) {}

  async getToken(payload: GetTokenOptions): Promise<string> {
    const { data } = await this.workos.post<
      GetTokenResponseResponse,
      SerializedGetTokenOptions
    >('/widgets/token', serializeGetTokenOptions(payload));

    return deserializeGetTokenResponse(data).token;
  }
}
