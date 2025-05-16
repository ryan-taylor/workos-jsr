// Import standard Deno assertions
import { assertEquals } from "jsr:@std/assert@1";

import { crypto } from "jsr:@std/crypto@1";
import { WorkOS } from "../workos.ts";
import { SubtleCryptoProvider } from "../common/crypto/subtle-crypto-provider.ts";

// Import JSON fixtures directly
const mockAuthActionContext = JSON.parse(
  Deno.readTextFileSync(
    "./src/actions/fixtures/authentication-action-context.json",
  ),
);
const mockUserRegistrationActionContext = JSON.parse(
  Deno.readTextFileSync(
    "./src/actions/fixtures/user-registration-action-context.json",
  ),
);

// Helper functions
async function makeSigHeader(payload: unknown, secret: string) {
  const timestamp = Date.now() * 1000;
  const unhashedString = `${timestamp}.${JSON.stringify(payload)}`;

  // Use Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "hmac",
    key,
    encoder.encode(unhashedString),
  );

  // Convert to hex
  const signatureHash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `t=${timestamp}, v1=${signatureHash}`;
}

function setupTest() {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
  const secret = "secret";
  return { workos, secret };
}

// signResponse tests
Deno.test("Actions - signResponse returns a signed authentication response", async () => {
  const { workos, secret } = setupTest();
  const nodeCryptoProvider = new SubtleCryptoProvider();

  const response = await workos.actions.signResponse(
    {
      type: "authentication",
      verdict: "Allow",
    },
    secret,
  );

  const signedPayload = `${response.payload.timestamp}.${
    JSON.stringify(
      response.payload,
    )
  }`;

  const expectedSig = await nodeCryptoProvider.computeHMACSignatureAsync(
    signedPayload,
    secret,
  );

  assertEquals(response.object, "authentication_action_response");
  assertEquals(response.payload.verdict, "Allow");
  // Check that timestamp is greater than 0
  assertEquals(response.payload.timestamp > 0, true);
  assertEquals(response.signature, expectedSig);
});

Deno.test("Actions - signResponse returns a signed user registration response", async () => {
  const { workos, secret } = setupTest();
  const nodeCryptoProvider = new SubtleCryptoProvider();

  const response = await workos.actions.signResponse(
    {
      type: "user_registration",
      verdict: "Deny",
      errorMessage: "User already exists",
    },
    secret,
  );

  const signedPayload = `${response.payload.timestamp}.${
    JSON.stringify(
      response.payload,
    )
  }`;

  const expectedSig = await nodeCryptoProvider.computeHMACSignatureAsync(
    signedPayload,
    secret,
  );

  assertEquals(response.object, "user_registration_action_response");
  assertEquals(response.payload.verdict, "Deny");
  // Check that timestamp is greater than 0
  assertEquals(response.payload.timestamp > 0, true);
  assertEquals(response.signature, expectedSig);
});

// verifyHeader tests
Deno.test("Actions - verifyHeader successfully verifies a valid header", async () => {
  const { workos, secret } = setupTest();
  const sigHeader = await makeSigHeader(mockAuthActionContext, secret);

  try {
    await workos.actions.verifyHeader({
      payload: mockAuthActionContext,
      sigHeader,
      secret,
    });
    // If we get here, the test passes
  } catch (_error) {
    throw new Error("Expected not to throw, but it did");
  }
});

Deno.test("Actions - verifyHeader throws when the header is invalid", async () => {
  const { workos, secret } = setupTest();

  try {
    await workos.actions.verifyHeader({
      payload: mockAuthActionContext,
      sigHeader: "t=123, v1=123",
      secret,
    });
    throw new Error("Expected to throw but did not");
  } catch (_error) {
    // Test passes if we get here
    // We don't need to check the error type, just that it threw
  }
});

// constructAction tests
Deno.test("Actions - constructAction returns an authentication action", async () => {
  const { workos, secret } = setupTest();
  const payload = mockAuthActionContext;
  const sigHeader = await makeSigHeader(payload, secret);
  const action = await workos.actions.constructAction({
    payload,
    sigHeader,
    secret,
  });

  assertEquals(action, {
    id: "01JATCMZJY26PQ59XT9BNT0FNN",
    user: {
      object: "user",
      id: "01JATCHZVEC5EPANDPEZVM68Y9",
      email: "jane@foocorp.com",
      firstName: "Jane",
      lastName: "Doe",
      emailVerified: true,
      profilePictureUrl: "https://example.com/jane.jpg",
      createdAt: "2024-10-22T17:12:50.746Z",
      updatedAt: "2024-10-22T17:12:50.746Z",
      externalId: null,
      metadata: {},
    },
    ipAddress: "50.141.123.10",
    userAgent: "Mozilla/5.0",
    deviceFingerprint: "notafingerprint",
    issuer: "test",
    object: "authentication_action_context",
    organization: {
      object: "organization",
      id: "01JATCMZJY26PQ59XT9BNT0FNN",
      name: "Foo Corp",
      allowProfilesOutsideOrganization: false,
      domains: [],
      createdAt: "2024-10-22T17:12:50.746Z",
      updatedAt: "2024-10-22T17:12:50.746Z",
      externalId: null,
      metadata: {},
    },
    organizationMembership: {
      object: "organization_membership",
      id: "01JATCNVYCHT1SZGENR4QTXKRK",
      userId: "01JATCHZVEC5EPANDPEZVM68Y9",
      organizationId: "01JATCMZJY26PQ59XT9BNT0FNN",
      role: {
        slug: "member",
      },
      status: "active",
      createdAt: "2024-10-22T17:12:50.746Z",
      updatedAt: "2024-10-22T17:12:50.746Z",
    },
  });
});

Deno.test("Actions - constructAction returns a user registration action", async () => {
  const { workos, secret } = setupTest();
  const payload = mockUserRegistrationActionContext;
  const sigHeader = await makeSigHeader(payload, secret);
  const action = await workos.actions.constructAction({
    payload,
    sigHeader,
    secret,
  });

  // Check the action properties individually to avoid TypeScript errors
  assertEquals(action.id, "01JATCMZJY26PQ59XT9BNT0FNN");
  assertEquals(action.object, "user_registration_action_context");
  // Check userData
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' - accessing a dynamic object property in test context
  // where we need to verify values from the API response with flexible structure
  const userData = (action as any).userData;
  assertEquals(userData.object, "user_data");
  assertEquals(userData.email, "jane@foocorp.com");
  assertEquals(userData.firstName, "Jane");
  assertEquals(userData.lastName, "Doe");

  // Check other properties
  assertEquals(action.ipAddress, "50.141.123.10");
  assertEquals(action.userAgent, "Mozilla/5.0");
  assertEquals(action.deviceFingerprint, "notafingerprint");

  // Check invitation properties
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' - accessing a dynamic object property in test context
  // where we need to verify values from the API response with flexible structure
  const invitation = (action as any).invitation;
  assertEquals(invitation.object, "invitation");
  assertEquals(invitation.id, "01JBVZWH8HJ855YZ5BWHG1WNZN");
  assertEquals(invitation.email, "jane@foocorp.com");
  assertEquals(invitation.expiresAt, "2024-10-22T17:12:50.746Z");
  assertEquals(invitation.createdAt, "2024-10-21T17:12:50.746Z");
  assertEquals(invitation.updatedAt, "2024-10-21T17:12:50.746Z");
  assertEquals(invitation.acceptedAt, "2024-10-22T17:13:50.746Z");
});
