import { deserializeUser } from './serializers/user.serializer.ts';
import { deserializeSession } from './serializers/session.serializer.ts';
import type {
  User,
  Session,
  CreateUserOptions,
  AuthenticateOptions,
} from './interfaces/index.ts';
import { fetchAndDeserialize } from '../common/utils/fetch-and-deserialize.ts';
import type { WorkOS } from '../workos.ts';
import type { GetOptions } from '../common/interfaces.ts';

export class UserManagement {
  constructor(private workos: WorkOS) {}

  async createUser(options: CreateUserOptions): Promise<User> {
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      '/user_management/users',
      deserializeUser,
      undefined,
      requestOptions
    );
    return result.data[0];
  }

  async getUser(id: string): Promise<User> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/users/${id}`,
      deserializeUser
    );
    return result.data[0];
  }

  async authenticate(options: AuthenticateOptions): Promise<Session> {
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      '/user_management/authenticate',
      deserializeSession,
      undefined,
      requestOptions
    );
    return result.data[0];
  }

  async getSession(id: string): Promise<Session> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/sessions/${id}`,
      deserializeSession
    );
    return result.data[0];
  }
}