// Import Deno standard testing library
import { assertEquals } from "@std/assert";

import {
  fetchBody,
  fetchOnce,
  resetMockFetch,
} from "../common/utils/test-utils.ts";
import { WorkOS } from "../workos.ts";
import generateLinkInvalid from "./fixtures/generate-link-invalid.json" with {
  type: "json",
};
import generateLink from "./fixtures/generate-link.json" with { type: "json" };
import { GeneratePortalLinkIntent } from "./interfaces/generate-portal-link-intent.interface.ts";

const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// Portal - generateLink with SSO intent
Deno.test("Portal - generateLink with the SSO intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.SSO,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.SSO,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with domain_verification intent
Deno.test("Portal - generateLink with the domain_verification intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.DomainVerification,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.DomainVerification,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with dsync intent
Deno.test("Portal - generateLink with the dsync intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.DSync,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.DSync,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with audit_logs intent
Deno.test("Portal - generateLink with the audit_logs intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.AuditLogs,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.AuditLogs,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with log_streams intent
Deno.test("Portal - generateLink with the log_streams intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.LogStreams,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.LogStreams,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with certificate_renewal intent
Deno.test("Portal - generateLink with the certificate_renewal intent returns an Admin Portal link", async () => {
  setup();

  fetchOnce(generateLink, { status: 201 });

  const { link } = await workos.portal.generateLink({
    intent: GeneratePortalLinkIntent.CertificateRenewal,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    returnUrl: "https://www.example.com",
  });

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.CertificateRenewal,
    organization: "org_01EHQMYV6MBK39QC5PZXHY59C3",
    return_url: "https://www.example.com",
  });
  assertEquals(link, "https://id.workos.com/portal/launch?secret=secret");
});

// Portal - generateLink with invalid organization
Deno.test("Portal - generateLink with an invalid organization throws an error", async () => {
  setup();

  fetchOnce(generateLinkInvalid, {
    status: 400,
    headers: { "X-Request-ID": "a-request-id" },
  });

  try {
    await workos.portal.generateLink({
      intent: GeneratePortalLinkIntent.SSO,
      organization: "bogus-id",
      returnUrl: "https://www.example.com",
    });
    throw new Error("Expected to throw but did not");
  } catch (error) {
    const err = error as Error;
    assertEquals(err instanceof Error, true);
    assertEquals(
      err.message.includes(
        "Could not find an organization with the id, bogus-id.",
      ),
      true,
    );
  }

  assertEquals(fetchBody(), {
    intent: GeneratePortalLinkIntent.SSO,
    organization: "bogus-id",
    return_url: "https://www.example.com",
  });
});
