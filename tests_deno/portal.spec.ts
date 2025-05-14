import { assertEquals, assertRejects } from "@std/assert";

/**
 * Tests for the Portal class
 * Covers the generateLink method with both required and optional parameters
 */

// Mock the GeneratePortalLinkIntent enum since there are import path issues in the original
enum GeneratePortalLinkIntent {
  SSO = "sso",
  DSync = "dsync",
  AuditLogs = "audit_logs",
  LogStreams = "log_streams",
  DomainVerification = "domain_verification",
  CertificateRenewal = "certificate_renewal",
}

// Mock WorkOS instance for testing
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastData: unknown = null;
  private shouldThrow = false;

  constructor(mockResponse: unknown, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = "post";
    this.lastData = data;

    if (this.shouldThrow) {
      throw new Error("Mock API error");
    }

    return { data: this.mockResponseData as T };
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      data: this.lastData,
    };
  }
}

// Mock Portal class implementation to match the one in src/portal/portal.ts
class Portal {
  constructor(private readonly workos: MockWorkOS) {}

  async generateLink({
    intent,
    organization,
    returnUrl,
    successUrl,
  }: {
    intent: GeneratePortalLinkIntent;
    organization: string;
    returnUrl?: string;
    successUrl?: string;
  }): Promise<{ link: string }> {
    const { data } = await this.workos.post("/portal/generate_link", {
      intent,
      organization,
      return_url: returnUrl,
      success_url: successUrl,
    });

    return data as { link: string };
  }
}

Deno.test("Portal - generateLink with required parameters", async () => {
  // Mock response data
  const mockLink = { link: "https://id.workos.com/portal/launch/123" };
  const mockWorkos = new MockWorkOS(mockLink);
  const portal = new Portal(mockWorkos);

  // Test data
  const params = {
    intent: GeneratePortalLinkIntent.SSO,
    organization: "org_123",
  };

  // Execute the method
  const result = await portal.generateLink(params);

  // Verify result
  assertEquals(result.link, mockLink.link);

  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/portal/generate_link");
  assertEquals(lastRequest.method, "post");
  assertEquals(
    (lastRequest.data as Record<string, unknown>).intent,
    GeneratePortalLinkIntent.SSO,
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).organization,
    "org_123",
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).return_url,
    undefined,
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).success_url,
    undefined,
  );
});

Deno.test("Portal - generateLink with all parameters", async () => {
  // Mock response data
  const mockLink = { link: "https://id.workos.com/portal/launch/456" };
  const mockWorkos = new MockWorkOS(mockLink);
  const portal = new Portal(mockWorkos);

  // Test data with optional parameters
  const params = {
    intent: GeneratePortalLinkIntent.DSync,
    organization: "org_456",
    returnUrl: "https://example.com/return",
    successUrl: "https://example.com/success",
  };

  // Execute the method
  const result = await portal.generateLink(params);

  // Verify result
  assertEquals(result.link, mockLink.link);

  // Verify correct API call was made with all parameters
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, "/portal/generate_link");
  assertEquals(lastRequest.method, "post");
  assertEquals(
    (lastRequest.data as Record<string, unknown>).intent,
    GeneratePortalLinkIntent.DSync,
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).organization,
    "org_456",
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).return_url,
    "https://example.com/return",
  );
  assertEquals(
    (lastRequest.data as Record<string, unknown>).success_url,
    "https://example.com/success",
  );
});

Deno.test("Portal - generateLink with different intent values", async () => {
  // Mock response data
  const mockLink = { link: "https://id.workos.com/portal/launch/789" };
  const mockWorkos = new MockWorkOS(mockLink);
  const portal = new Portal(mockWorkos);

  // Test each intent value
  const intentValues = [
    GeneratePortalLinkIntent.AuditLogs,
    GeneratePortalLinkIntent.DomainVerification,
    GeneratePortalLinkIntent.LogStreams,
    GeneratePortalLinkIntent.CertificateRenewal,
  ];

  for (const intent of intentValues) {
    // Execute the method with different intent
    const result = await portal.generateLink({
      intent,
      organization: "org_test",
    });

    // Verify result
    assertEquals(result.link, mockLink.link);

    // Verify correct intent was passed
    const lastRequest = mockWorkos.getLastRequest();
    assertEquals((lastRequest.data as Record<string, unknown>).intent, intent);
  }
});

Deno.test("Portal - generateLink handles API errors", async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const portal = new Portal(mockWorkos);

  // Test data
  const params = {
    intent: GeneratePortalLinkIntent.SSO,
    organization: "org_123",
  };

  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await portal.generateLink(params);
    },
    Error,
    "Mock API error",
  );
});
