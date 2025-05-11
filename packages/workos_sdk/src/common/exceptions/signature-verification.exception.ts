export class SignatureVerificationException extends Error {
  override readonly name = 'SignatureVerificationException';

  constructor(message: string) {
    super(message || 'Signature verification failed.');
  }
}
