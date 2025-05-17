// deno-lint-ignore-file no-unused-vars
/**
 * Compile-time type tests for JWT and crypto module type definitions
 *
 * These tests focus on TypeScript's ability to enforce type safety at compile time.
 * Most of these tests aren't meant to be executed at runtime - they're designed to
 * verify that TypeScript catches type errors during compilation.
 */

import {
  JWTHeader,
  JWTPayload,
  SignaturePayload,
  SignatureTimestamp,
} from "../../../src/common/crypto/jwt-utils.ts";

// This test file focuses on compile-time type checking
// The assertions here are primarily for TypeScript to verify during compilation

Deno.test("TypeScript Compile-time Type Safety Tests", () => {
  // This test is a container for compile-time type checks
  // It doesn't execute meaningful runtime assertions, but verifies
  // that TypeScript enforces our type definitions correctly

  // ----- JWTHeader compile-time checks -----

  // Valid JWTHeader definitions (should compile without errors)
  const validHeader1: JWTHeader = { alg: "HS256" };
  const validHeader2: JWTHeader = { alg: "RS256", typ: "JWT" };
  const validHeader3: JWTHeader = {
    alg: "ES384",
    kid: "key-1",
    customField: "value",
  };

  // TypeScript should catch this error at compile time:
  // @ts-expect-error - Missing required 'alg' property
  const invalidHeader1: JWTHeader = { typ: "JWT" };

  // ----- JWTPayload compile-time checks -----

  // Valid JWTPayload definitions (should compile without errors)
  const validPayload1: JWTPayload = {};
  const validPayload2: JWTPayload = {
    sub: "user-123",
    iss: "https://workos.com",
  };
  const validPayload3: JWTPayload = {
    sub: "user-456",
    aud: "client-789",
    exp: 1620000000,
    customClaim: { nested: "value" },
  };

  // All of these should be valid according to our type definition
  const audString: JWTPayload = { aud: "single-audience" };
  const audArray: JWTPayload = { aud: ["aud1", "aud2"] };

  // ----- SignatureTimestamp compile-time checks -----

  // Valid SignatureTimestamp values (should compile without errors)
  const timestamp1: SignatureTimestamp = 1620000000;
  const timestamp2: SignatureTimestamp = "2023-05-10T15:30:45Z";
  const timestamp3: SignatureTimestamp = new Date();

  // TypeScript should catch these errors at compile time:
  // @ts-expect-error - Object is not a valid SignatureTimestamp
  const invalidTimestamp1: SignatureTimestamp = { time: 1620000000 };
  // @ts-expect-error - Boolean is not a valid SignatureTimestamp
  const invalidTimestamp2: SignatureTimestamp = true;

  // ----- SignaturePayload compile-time checks -----

  // Valid SignaturePayload values (should compile without errors)
  const validSigPayload1: SignaturePayload = {};
  const validSigPayload2: SignaturePayload = { key: "value" };
  const validSigPayload3: SignaturePayload = {
    nested: { object: true },
    array: [1, 2, 3],
    mixed: [{ key: "value" }, 123, "string"],
  };

  // ----- Type compatibility tests -----

  // Verify compatibility between interfaces
  function acceptsHeader(header: JWTHeader): void {
    // Just a test function to verify type compatibility
  }

  // These should be accepted by the function
  acceptsHeader({ alg: "HS256" });
  acceptsHeader({ alg: "RS256", typ: "JWT" });

  // This should cause a compile-time error
  // @ts-expect-error - Missing required 'alg' property
  acceptsHeader({ typ: "JWT" });

  // ----- Type narrowing tests -----

  // Function that demonstrates type narrowing with SignatureTimestamp
  function processTimestamp(ts: SignatureTimestamp): number {
    if (typeof ts === "number") {
      // In this block, TypeScript knows ts is a number
      return ts;
    } else if (typeof ts === "string") {
      // In this block, TypeScript knows ts is a string
      return new Date(ts).getTime() / 1000;
    } else {
      // In this block, TypeScript knows ts is a Date
      return ts.getTime() / 1000;
    }
  }

  // Verify function works with all valid timestamp types
  processTimestamp(1620000000);
  processTimestamp("2023-05-10T15:30:45Z");
  processTimestamp(new Date());

  // ----- Type indexing tests -----

  // Demonstrate type-safe access to JWTPayload properties
  function getPayloadClaim<T extends keyof JWTPayload>(
    payload: JWTPayload,
    claim: T,
  ): JWTPayload[T] | undefined {
    return payload[claim];
  }

  const testPayload: JWTPayload = {
    sub: "user-123",
    iss: "https://workos.com",
    exp: 1620000000,
  };

  // TypeScript should infer the correct types for these
  const subClaim = getPayloadClaim(testPayload, "sub");
  const issClaim = getPayloadClaim(testPayload, "iss");
  const expClaim = getPayloadClaim(testPayload, "exp");

  // ----- Type assignment compatibility tests -----

  // Test type assignment compatibility between similar structures
  type CustomHeader = {
    alg: string;
    typ?: string;
    additionalProp?: boolean;
  };

  // This should be allowed (structural typing)
  const headerFromCustom: JWTHeader = {
    alg: "HS256",
    typ: "JWT",
    additionalProp: true,
  } satisfies CustomHeader;

  // This demonstrates the openness of the JWTPayload type
  const complexPayload: JWTPayload = {
    standard: {
      sub: "user-123",
      iss: "https://workos.com",
    },
    custom: {
      permissions: ["read", "write"],
      nested: {
        deeply: {
          value: true,
        },
      },
    },
  };
});
