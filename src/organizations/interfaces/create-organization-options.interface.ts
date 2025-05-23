import type { PostOptions } from "../../common/interfaces.ts";
import type { DomainData } from "./domain-data.interface.ts";
import type { MetadataMap } from "../../common/interfaces/metadata.interface.ts";

export interface CreateOrganizationOptions {
  name: string;
  domainData?: DomainData[];
  externalId?: string | null;
  metadata?: MetadataMap;

  /**
   * @deprecated If you need to allow sign-ins from any email domain, contact support@workos.com.
   */
  allowProfilesOutsideOrganization?: boolean;
  /**
   * @deprecated Use `domain_data` instead.
   */
  domains?: string[];
}

export interface SerializedCreateOrganizationOptions {
  name: string;
  domain_data?: DomainData[];
  external_id?: string | null;
  metadata?: MetadataMap;

  /**
   * @deprecated If you need to allow sign-ins from any email domain, contact support@workos.com.
   */
  allow_profiles_outside_organization?: boolean;
  /**
   * @deprecated Use `domain_data` instead.
   */
  domains?: string[];
}

export interface CreateOrganizationRequestOptions
  extends Pick<PostOptions, "idempotencyKey"> {}
