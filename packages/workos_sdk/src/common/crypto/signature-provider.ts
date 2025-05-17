import { SignatureVerificationException } from "../exceptions/signature-verification.exception.ts";
import type { CryptoProvider } from "./crypto-provider.ts";

export class SignatureProvider {
  private cryptoProvider: CryptoProvider;

  constructor(cryptoProvider: CryptoProvider) {
    this.cryptoProvider = cryptoProvider;
  }

  verifyHeader({
    payload,
    sigHeader,
    secret,
    tolerance = 180000,
  }: {
    payload: any;
    sigHeader: string;
    secret: string;
    tolerance?: number;
  }): Promise<boolean> {
    const [timestamp, signatureHash] = this.getTimestampAndSignatureHash(
      sigHeader,
    );

    if (!signatureHash || Object.keys(signatureHash).length === 0) {
      throw new SignatureVerificationException(
        "No signature hash found with expected scheme v1",
      );
    }

    if (parseInt(timestamp, 10) < Date.now() - tolerance) {
      throw new SignatureVerificationException(
        "Timestamp outside the tolerance zone",
      );
    }

    return this.computeSignature(timestamp, payload, secret)
      .then((expectedSig) => {
        return this.cryptoProvider.secureCompare(expectedSig, signatureHash);
      })
      .then((isMatch) => {
        if (isMatch === false) {
          throw new SignatureVerificationException(
            "Signature hash does not match the expected signature hash for payload",
          );
        }
        return true;
      });
  }

  getTimestampAndSignatureHash(sigHeader: string): [string, string] {
    const signature = sigHeader;
    const [t, v1] = signature.split(",");
    if (typeof t === "undefined" || typeof v1 === "undefined") {
      throw new SignatureVerificationException(
        "Signature or timestamp missing",
      );
    }
    const { 1: timestamp } = t.split("=");
    const { 1: signatureHash } = v1.split("=");

    return [timestamp, signatureHash];
  }

  async computeSignature(
    timestamp: any,
    payload: any,
    secret: string,
  ): Promise<string> {
    payload = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payload}`;

    return await this.cryptoProvider.computeHMACSignatureAsync(
      signedPayload,
      secret,
    );
  }
}
