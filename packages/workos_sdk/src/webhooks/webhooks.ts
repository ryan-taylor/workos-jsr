import { deserializeWebhookEvent } from "./serializers/webhook-event.serializer.ts";
import type {
  VerifyOptions,
  WebhookEvent,
} from "./interfaces/index.ts";
import { SignatureVerificationException } from "../common/exceptions/signature-verification.exception.ts";

export class Webhooks {
  static constructEvent(
    payload: string,
    signature: string,
    secret: string,
  ): WebhookEvent {
    const data = JSON.parse(payload);
    return deserializeWebhookEvent(data);
  }

  static async verifySignature(
    { payload, signature, secret, tolerance = 180 }: VerifyOptions,
  ): Promise<void> {
    const timestamp = Date.now() / 1000;
    const providedSignature = signature.split(",")[1];

    if (!providedSignature) {
      throw new SignatureVerificationException(
        "No signature found with expected format",
      );
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureData = encoder.encode(`${timestamp}.${payload}`);
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      signatureData,
    );

    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignatureHex !== providedSignature) {
      throw new SignatureVerificationException("Signature mismatch");
    }

    const timestampAge = timestamp - parseInt(signature.split(",")[0]);
    if (Math.abs(timestampAge) > tolerance) {
      throw new SignatureVerificationException(
        "Timestamp outside tolerance zone",
      );
    }
  }
}
