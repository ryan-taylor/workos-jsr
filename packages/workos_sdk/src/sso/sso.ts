import { deserializeProfile } from "./serializers/profile.serializer.ts";
import { deserializeConnection } from "./serializers/connection.serializer.ts";
import { serializeGetAuthorizationUrlOptions } from "./serializers/get-authorization-url-options.serializer.ts";
import type {
  Connection,
  GetAuthorizationUrlOptions,
  Profile,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";

export class SSO {
  constructor(private apiKey: string) {}

  async getProfile(code: string): Promise<Profile> {
    return await fetchAndDeserialize({
      endpoint: "/sso/profile",
      method: "POST",
      data: { code },
      deserializer: deserializeProfile,
      apiKey: this.apiKey,
    });
  }

  async getConnection(id: string): Promise<Connection> {
    return await fetchAndDeserialize({
      endpoint: `/connections/${id}`,
      method: "GET",
      deserializer: deserializeConnection,
      apiKey: this.apiKey,
    });
  }

  getAuthorizationUrl(options: GetAuthorizationUrlOptions): string {
    const params = new URLSearchParams(
      serializeGetAuthorizationUrlOptions(options) as Record<string, string>,
    );
    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }
}
