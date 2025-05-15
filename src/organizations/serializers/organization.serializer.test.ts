import { deserializeOrganization } from "./organization.serializer.ts";
import { assertEquals } from "https://deno.land/std/assert/mod.ts";

// Mock organization fixture since import path is failing
const organizationFixture = {
  id: "org_01EHWNCEGRABT9A8MTEFJ0BB4M",
  name: "Acme Inc.",
  domains: [],
  metadata: { key: "value" },
};

const organizationResponse = {
  ...organizationFixture,
  object: "organization" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  domains: [],
};

Deno.test("deserializeOrganization - includes metadata if present", () => {
  const metadata = { key: "value" };

  const result = deserializeOrganization({
    ...organizationResponse,
    metadata,
  });

  assertEquals(result.metadata, metadata);
});

Deno.test("deserializeOrganization - coerces missing metadata to empty object", () => {
  const { metadata: _metadata, ...organizationResponseWithoutMetadata } =
    organizationResponse;

  const result = deserializeOrganization(organizationResponseWithoutMetadata);

  assertEquals(result.metadata, {});
});
