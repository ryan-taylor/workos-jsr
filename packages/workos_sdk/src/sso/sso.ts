import { deserializeProfile } from "./serializers/profile.serializer.ts";
import { deserializeConnection } from "./serializers/connection.serializer.ts";
import { serializeGetAuthorizationUrlOptions } from "./serializers/get-authorization-url-options.serializer.ts";
import type {
  Connection,
  GetAuthorizationUrlOptions,
  Profile,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";

export class SSO {
  constructor(private readonly workos: WorkOS) {}

  async getProfile(code: string): Promise<Profile> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Profile>({
      workos: this.workos,
      path: "/sso/profile",
      method: "POST",
      data: { code },
      deserializer: deserializeProfile,
    });
    if (Array.isArray(result)) {
      return result[0];
    }
    return result as Profile;
  }

  async getConnection(id: string): Promise<Connection> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Connection>({
      workos: this.workos,
      path: `/connections/${id}`,
      method: "GET",
      deserializer: deserializeConnection,
    });
    if (Array.isArray(result)) {
      return result[0];
    }
    return result as Connection;
  }

  getAuthorizationUrl(options: GetAuthorizationUrlOptions): string {
    const params = new URLSearchParams(
      serializeGetAuthorizationUrlOptions(options) as Record<string, string>,
    );
    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }
}
