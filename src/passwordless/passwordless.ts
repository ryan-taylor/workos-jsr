import type { WorkOS } from "@ryantaylor/workos";
import type {
  CreatePasswordlessSessionOptions,
  PasswordlessSession,
  PasswordlessSessionResponse,
  SendSessionResponse,
  SerializedCreatePasswordlessSessionOptions,
} from "$sdk/passwordless/interfaces";
import { deserializePasswordlessSession } from "$sdk/passwordless/serializers/passwordless-session.serializer";

export class Passwordless {
  constructor(private readonly workos: WorkOS) {}

  createSession({
    redirectURI,
    expiresIn,
    ...options
  }: CreatePasswordlessSessionOptions): Promise<PasswordlessSession> {
    return this.workos.post<
      PasswordlessSessionResponse,
      SerializedCreatePasswordlessSessionOptions
    >("/passwordless/sessions", {
      ...options,
      redirect_uri: redirectURI,
      expires_in: expiresIn,
    }).then(({ data }) => deserializePasswordlessSession(data));
  }

  sendSession(sessionId: string): Promise<SendSessionResponse> {
    return this.workos.post(
      `/passwordless/sessions/${sessionId}/send`,
      {},
    ).then(({ data }) => data);
  }
}
