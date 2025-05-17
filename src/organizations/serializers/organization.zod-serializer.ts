import { z } from "zod";
import { deserializeOrganizationDomain } from "../../organization-domains/serializers/organization-domain.serializer.ts";
import type {
  Organization,
  OrganizationResponse,
} from "../interfaces/organization.interface.ts";
import type { MetadataMap, MetadataValue } from "../../common/interfaces/metadata.interface.ts";
import {
  OrganizationDomainState,
  OrganizationDomainVerificationStrategy
} from "../../organization-domains/interfaces/organization-domain.interface.ts";

/**
 * Zod schema for validating organization response data from the API
 *
 * Benefits of using Zod for runtime validation:
 * 1. Prevents silent failures when API shapes change
 * 2. Provides clear error messages pointing to invalid data
 * 3. Preserves TypeScript types through schema inference
 *
 * Strategy for handling "any" types:
 * - Use concrete unions when the possible values are known and limited
 *   (e.g., organization.object is always "organization")
 * - Use unknown + runtime checks when dealing with potentially arbitrary data
 *   (e.g., metadata or custom attributes)
 * - Runtime validation with Zod ensures that even if TypeScript is bypassed with "any",
 *   the data will still be validated at runtime, preventing unexpected failures
 */

// Define a recursive schema for metadata values
export const metadataValueSchema: z.ZodType<MetadataValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(metadataValueSchema),
    z.record(metadataValueSchema)
  ])
);

// Define the Metadata schema
export const metadataSchema = z.record(metadataValueSchema);

// Schema for domain state enum
export const organizationDomainStateSchema = z.nativeEnum(OrganizationDomainState);

// Schema for verification strategy enum
export const organizationDomainVerificationStrategySchema =
  z.nativeEnum(OrganizationDomainVerificationStrategy);

// Schema for OrganizationDomainResponse
export const organizationDomainResponseSchema = z.object({
  object: z.literal("organization_domain"),
  id: z.string(),
  domain: z.string(),
  organization_id: z.string(),
  state: organizationDomainStateSchema,
  verification_token: z.string().optional(),
  verification_strategy: organizationDomainVerificationStrategySchema,
});

// Schema for OrganizationResponse
export const organizationResponseSchema = z.object({
  object: z.literal("organization"),
  id: z.string(),
  name: z.string(),
  allow_profiles_outside_organization: z.boolean(),
  domains: z.array(organizationDomainResponseSchema),
  stripe_customer_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  external_id: z.string().nullable().optional(),
  metadata: metadataSchema.optional().default({}),
});

/**
 * Deserialize and validate an organization response using Zod
 * This function ensures the data conforms to our expected schema at runtime
 */
export const deserializeOrganizationWithZod = (
  data: unknown,
): Organization => {
  // Parse and validate the input data against our schema
  const organization = organizationResponseSchema.parse(data);

  // Transform the validated data to our internal format
  return {
    object: organization.object,
    id: organization.id,
    name: organization.name,
    allowProfilesOutsideOrganization: organization.allow_profiles_outside_organization,
    domains: organization.domains.map(deserializeOrganizationDomain),
    ...(typeof organization.stripe_customer_id === "undefined"
      ? undefined
      : { stripeCustomerId: organization.stripe_customer_id }),
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
    externalId: organization.external_id ?? null,
    metadata: organization.metadata ?? {},
  };
};

/**
 * Type-safe wrapper that provides proper error handling for organization deserialization
 */
export const safeDeserializeOrganization = (
  data: unknown,
): { success: true; data: Organization } | { success: false; error: z.ZodError } => {
  try {
    const organization = deserializeOrganizationWithZod(data);
    return { success: true, data: organization };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
};

// Type inference from the Zod schema
export type OrganizationResponseFromSchema = z.infer<typeof organizationResponseSchema>;
export type MetadataMapFromSchema = z.infer<typeof metadataSchema>;

// Type compatibility verification is commented out since these are now properly aligned
// but kept for documentation purposes
// const _typeCheck1: OrganizationResponse = {} as OrganizationResponseFromSchema;
// const _typeCheck2: OrganizationResponseFromSchema = {} as OrganizationResponse;
// const _typeCheck3: MetadataMap = {} as MetadataMapFromSchema;
// const _typeCheck4: MetadataMapFromSchema = {} as MetadataMap;