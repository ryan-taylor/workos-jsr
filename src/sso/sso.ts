import {
  AutoPaginatable,
  type PaginatedResponse,
} from "../common/utils/pagination.ts";
import type { WorkOS } from "../workos.ts";
import type {
  Connection,
  GetAuthorizationURLOptions, // Corrected from AuthorizationURLOptions
  GetProfileOptions, // Corrected from GetProfileAndTokenOptions
  ListConnectionsOptions,
  Profile,
} from "./interfaces.ts";
import {
  deserializeConnection,
  deserializeProfile, // Corrected from deserializeProfileAndToken
  serializeListConnectionsOptions,
} from "./serializers.ts";
// Removed unused imports

// Define response types locally instead of importing
type ConnectionResponse = {
  data: Connection;
};

type ProfileResponse = {
  data: Profile;
};

// Removed unused type definition

const toQueryString = (options: Record<string, string | undefined>): string => {
  const searchParams = new URLSearchParams();
  const keys = Object.keys(options).sort();

  for (const key of keys) {
    const value = options[key];

    if (value) {
      searchParams.append(key, value);
    }
  }

  return searchParams.toString();
};

export class SSO {
  constructor(private readonly workos: WorkOS) {}

  async listConnections(
    options?: ListConnectionsOptions,
  ): Promise<AutoPaginatable<Connection>> {
    const fetchFunction = async (): Promise<PaginatedResponse<Connection>> => {
      // Use a completely generic type to avoid type errors with inconsistent API responses
      const response = await this.workos.get(
        "/connections",
        options ? serializeListConnectionsOptions(options) : undefined,
      ) as unknown as {
        data: Record<string, unknown> | Record<string, unknown>[];
        list_metadata?: {
          before?: string;
          after?: string;
        };
      };

      // Handle both array and single object responses
      const connections = Array.isArray(response.data)
        ? response.data.map((item) => deserializeConnection(item))
        : [deserializeConnection(response.data)];

      return {
        data: connections,
        list_metadata: {
          before: response.list_metadata?.before || null,
          after: response.list_metadata?.after || null,
        },
      };
    };

    return new AutoPaginatable(fetchFunction);
  }

  async deleteConnection(id: string) {
    await this.workos.delete(`/connections/${id}`);
  }

  getAuthorizationUrl({
    connection,
    provider,
    organization,
    redirect_uri,
    state,
    domain_hint,
    login_hint,
  }: GetAuthorizationURLOptions): string {
    if (!provider && !connection && !organization) {
      throw new Error(
        `Incomplete arguments. Need to specify either a 'connection', 'organization', or 'provider'.`,
      );
    }

    const query = toQueryString({
      connection,
      organization,
      provider,
      domain_hint,
      login_hint,
      client_id: this.workos.clientId,
      redirect_uri,
      response_type: "code",
      state,
    });

    return `${this.workos.baseURL}/sso/authorize?${query}`;
  }

  async getConnection(id: string): Promise<Connection> {
    const { data } = await this.workos.get<ConnectionResponse>(
      `/connections/${id}`,
    );

    return deserializeConnection(data);
  }

  async getProfile({
    code,
    connection,
  }: GetProfileOptions): Promise<Profile> {
    const form = new URLSearchParams({
      client_id: this.workos.clientId as string,
      client_secret: this.workos.key as string,
      grant_type: "authorization_code",
      code,
    });

    if (connection) {
      form.append("connection", connection);
    }

    const { data } = await this.workos.post<ProfileResponse>(
      "/sso/token",
      form,
    );

    return deserializeProfile(data);
  }

  async getProfileWithToken({
    accessToken,
  }: { accessToken: string }): Promise<Profile> {
    const { data } = await this.workos.get<ProfileResponse>("/sso/profile", {
      accessToken,
    });

    return deserializeProfile(data);
  }
}
