import { deserializeSession } from './serializers/session.serializer.ts';
import { serializeCreateSessionOptions } from './serializers/create-session-options.serializer.ts';
import type { PasswordlessSession, CreateSessionOptions } from './interfaces/index.ts';
import type { WorkOS } from '../workos.ts';

export class Passwordless {
  constructor(private workos: WorkOS) {}

  async createSession(options: CreateSessionOptions): Promise<PasswordlessSession> {
    const { data } = await this.workos.post<Record<string, unknown>>(
      '/passwordless/sessions',
      serializeCreateSessionOptions(options)
    );
    return deserializeSession(data);
  }

  async getSession(id: string): Promise<PasswordlessSession> {
    const { data } = await this.workos.get<Record<string, unknown>>(
      `/passwordless/sessions/${id}`
    );
    return deserializeSession(data);
  }
}