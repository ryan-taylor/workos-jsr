// Import Deno testing utilities
import { assertEquals } from "jsr:@std/assert@^1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1/bdd";

import { crypto } from "jsr:@std/crypto@^1";
import { SubtleCryptoProvider } from "./subtle-crypto-provider.ts";
import { SignatureProvider } from "./signature-provider.ts";

// Main test suite
describe("CryptoProvider", () => {
  let payload: Record<string, unknown>;
  let secret: string;
  let timestamp: number;
  let signatureHash: string;

  beforeEach(async () => {
    // Load webhook fixture directly
    payload = {
      "id": "wh_123",
      "data": {
        "id": "directory_user_01FAEAJCR3ZBZ30D8BD1924TVG",
        "state": "active",
        "emails": [
          {
            "type": "work",
            "value": "blair@foo-corp.com",
            "primary": true,
          },
        ],
        "idp_id": "00u1e8mutl6wlH3lL4x7",
        "object": "directory_user",
        "username": "blair@foo-corp.com",
        "last_name": "Lunchford",
        "first_name": "Blair",
        "job_title": "Software Engineer",
        "directory_id": "directory_01F9M7F68PZP8QXP8G7X5QRHS7",
      },
      "event": "dsync.user.created",
      "created_at": "2021-06-25T19:07:33.155Z",
    };

    secret = "secret";
    timestamp = Date.now() * 1000;
    const unhashedString = `${timestamp}.${JSON.stringify(payload)}`;

    // Deno crypto uses Web Crypto API
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
    signatureHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });

  describe("when computing HMAC signature", () => {
    it("returns the same for two SubtleCryptoProvider instances", async () => {
      const subtleCryptoProvider1 = new SubtleCryptoProvider();
      const subtleCryptoProvider2 = new SubtleCryptoProvider();

      const stringifiedPayload = JSON.stringify(payload);
      const payloadHMAC = `${timestamp}.${stringifiedPayload}`;

      const compare1 = await subtleCryptoProvider1.computeHMACSignatureAsync(
        payloadHMAC,
        secret,
      );
      const compare2 = await subtleCryptoProvider2.computeHMACSignatureAsync(
        payloadHMAC,
        secret,
      );

      assertEquals(compare1, compare2);
    });
  });

  describe("when securely comparing", () => {
    it("returns the same for two SubtleCryptoProvider instances", async () => {
      const subtleCryptoProvider1 = new SubtleCryptoProvider();
      const subtleCryptoProvider2 = new SubtleCryptoProvider();
      const signatureProvider = new SignatureProvider(subtleCryptoProvider1);

      const signature = await signatureProvider.computeSignature(
        timestamp,
        payload,
        secret,
      );

      assertEquals(
        subtleCryptoProvider1.secureCompare(signature, signatureHash),
        subtleCryptoProvider2.secureCompare(signature, signatureHash),
      );

      assertEquals(
        subtleCryptoProvider1.secureCompare(signature, "foo"),
        subtleCryptoProvider2.secureCompare(signature, "foo"),
      );
    });
  });
});
