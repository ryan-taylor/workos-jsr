// Import Deno testing utilities
import { assertEquals, beforeEach, describe, it } from '../../../tests/deno-test-setup.ts';

import { crypto } from '@std/crypto';
import { SubtleCryptoProvider } from './subtle-crypto-provider.ts';
import { SignatureProvider } from './signature-provider.ts';

// Main test suite
describe('SignatureProvider', () => {
  let payload: Record<string, unknown>;
  let secret: string;
  let timestamp: number;
  let signatureHash: string;
  const signatureProvider = new SignatureProvider(new SubtleCryptoProvider());

  beforeEach(async () => {
    // Load webhook fixture directly
    payload = {
      'id': 'wh_123',
      'data': {
        'id': 'directory_user_01FAEAJCR3ZBZ30D8BD1924TVG',
        'state': 'active',
        'emails': [
          {
            'type': 'work',
            'value': 'blair@foo-corp.com',
            'primary': true,
          },
        ],
        'idp_id': '00u1e8mutl6wlH3lL4x7',
        'object': 'directory_user',
        'username': 'blair@foo-corp.com',
        'last_name': 'Lunchford',
        'first_name': 'Blair',
        'job_title': 'Software Engineer',
        'directory_id': 'directory_01F9M7F68PZP8QXP8G7X5QRHS7',
      },
      'event': 'dsync.user.created',
      'created_at': '2021-06-25T19:07:33.155Z',
    };

    secret = 'secret';
    timestamp = Date.now() * 1000;
    const unhashedString = `${timestamp}.${JSON.stringify(payload)}`;

    // Use Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      {
        name: 'HMAC',
        hash: { name: 'SHA-256' },
      },
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign(
      'hmac',
      key,
      encoder.encode(unhashedString),
    );

    // Convert to hex
    signatureHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  });

  describe('verifyHeader', () => {
    it('returns true when the signature is valid', async () => {
      const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
      const options = { payload, sigHeader, secret };
      const result = await signatureProvider.verifyHeader(options);
      assertEquals(result, true);
    });
  });

  describe('getTimestampAndSignatureHash', () => {
    it('returns the timestamp and signature when the signature is valid', () => {
      const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
      const timestampAndSignature = signatureProvider.getTimestampAndSignatureHash(sigHeader);

      assertEquals(timestampAndSignature, [
        timestamp.toString(),
        signatureHash,
      ]);
    });
  });

  describe('computeSignature', () => {
    it('returns the computed signature', async () => {
      const signature = await signatureProvider.computeSignature(
        timestamp,
        payload,
        secret,
      );

      assertEquals(signature, signatureHash);
    });
  });

  describe('when in an environment that supports SubtleCrypto', () => {
    it('automatically uses the subtle crypto library', () => {
      // Access private property with type assertion
      const cryptoProvider = (signatureProvider as unknown as { cryptoProvider: unknown }).cryptoProvider;
      assertEquals(cryptoProvider instanceof SubtleCryptoProvider, true);
    });
  });
});
