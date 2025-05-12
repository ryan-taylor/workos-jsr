import { deserializeUser } from "./serializers/user.serializer.ts";
import { deserializeSession } from "./serializers/session.serializer.ts";
import type {
  AuthenticateOptions,
  CreateUserOptions,
  Session,
  User,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { GetOptions } from "../common/interfaces.ts";
import type { List } from "../common/interfaces.ts";

export class UserManagement {
  constructor(private workos: WorkOS, _sessionProvider?: unknown) {}

  async createUser(options: CreateUserOptions): Promise<User> {
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      "/user_management/users",
      deserializeUser,
      undefined,
      requestOptions,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<User>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as User;
  }

  async getUser(id: string): Promise<User> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/users/${id}`,
      deserializeUser,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<User>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as User;
  }

  async authenticate(options: AuthenticateOptions): Promise<Session> {
    const requestOptions: GetOptions = {
      params: options as unknown as Record<string, string | number | boolean>,
    };

    const result = await fetchAndDeserialize(
      this.workos,
      "/user_management/authenticate",
      deserializeSession,
      undefined,
      requestOptions,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<Session>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as Session;
  }

  async getSession(id: string): Promise<Session> {
    const result = await fetchAndDeserialize(
      this.workos,
      `/user_management/sessions/${id}`,
      deserializeSession,
    );

    if (result && typeof result === "object" && "data" in result) {
      return (result as List<Session>).data[0];
    }

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as Session;
  }
}
