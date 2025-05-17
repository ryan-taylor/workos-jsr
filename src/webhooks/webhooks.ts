import { deserializeEvent } from "$sdk/common/serializers";
import type { Event, EventResponse } from "$sdk/common/interfaces";
import { SignatureProvider } from "$sdk/common/crypto/signature-provider";
import type { CryptoProvider } from "$sdk/common/crypto/crypto-provider";

export class Webhooks {
  private signatureProvider: SignatureProvider;

  constructor(cryptoProvider: CryptoProvider) {
    this.signatureProvider = new SignatureProvider(cryptoProvider);
  }

  get verifyHeader() {
    return this.signatureProvider.verifyHeader.bind(this.signatureProvider);
  }

  get computeSignature() {
    return this.signatureProvider.computeSignature.bind(this.signatureProvider);
  }

  get getTimestampAndSignatureHash() {
    return this.signatureProvider.getTimestampAndSignatureHash.bind(
      this.signatureProvider,
    );
  }

  constructEvent({
    payload,
    sigHeader,
    secret,
    tolerance = 180000,
  }: {
    payload: unknown;
    sigHeader: string;
    secret: string;
    tolerance?: number;
  }): Promise<Event> {
    const options = { payload, sigHeader, secret, tolerance };
    return this.verifyHeader(options).then(() => {
      const webhookPayload = payload as EventResponse;
      return deserializeEvent(webhookPayload);
    });
  }
}
