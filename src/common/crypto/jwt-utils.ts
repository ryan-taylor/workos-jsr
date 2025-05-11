/**
 * JWT utilities using WebCrypto
 * This module replaces the jose dependency with native WebCrypto implementations
 */

/**
 * Standard JWT claims interface
 */
export interface JWTPayload {
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string | string[]; // audience
  exp?: number; // expiration time
  nbf?: number; // not before
  iat?: number; // issued at
  jti?: string; // JWT ID
  [key: string]: any; // Allow additional properties
}

/**
 * Decodes a JWT without verifying the signature.
 * @param token The JWT to decode
 * @returns The decoded payload as a JavaScript object
 */
export function decodeJwt<T extends JWTPayload = JWTPayload>(token: string): T {
  try {
    // Split the token into header, payload, and signature
    const [, payloadB64] = token.split('.');

    // Base64 decode the payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));

    // Parse and return the payload as a JavaScript object
    return JSON.parse(payloadJson) as T;
  } catch (error) {
    throw new Error(`Invalid JWT: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a function that fetches JWKs from a remote endpoint.
 * @param url URL of the JWKS endpoint
 * @returns A function that fetches and caches JWKs
 */
export function createRemoteJWKSet(url: URL | string) {
  // Convert string to URL if necessary
  const jwksUrl = typeof url === 'string' ? new URL(url) : url;

  // Cache for the fetched JWKs and timestamp
  let jwksCache: { keys: JsonWebKey[] } | null = null;
  let lastFetchTime = 0;
  const MAX_CACHE_AGE = 3600000; // 1 hour in milliseconds

  // Return a function that gets the JWKs
  return async function getJwks(
    protectedHeader: { kid?: string },
  ): Promise<CryptoKey> {
    // Fetch the JWKs if not cached or cache is expired
    const now = Date.now();
    if (!jwksCache || now - lastFetchTime > MAX_CACHE_AGE) {
      const response = await fetch(jwksUrl.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch JWKs: ${response.status} ${response.statusText}`);
      }

      jwksCache = await response.json();
      lastFetchTime = now;
    }

    // At this point jwksCache is guaranteed to be non-null
    const keys = jwksCache!.keys;

    // Find the key that matches the key ID in the header
    const { kid } = protectedHeader;
    const jwk = kid ? keys.find((key) => (key as any).kid === kid) : keys[0];

    if (!jwk) {
      throw new Error(`No matching key found for kid: ${kid}`);
    }

    // Import the JWK as a CryptoKey
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RS256',
        hash: { name: 'SHA-256' },
      },
      false,
      ['verify'],
    );
  };
}

/**
 * Verifies a JWT using a JWK
 * @param token The JWT to verify
 * @param getKey Function that returns a CryptoKey for verification
 * @returns The verified payload
 */
export async function jwtVerify<T extends JWTPayload = JWTPayload>(
  token: string,
  getKey: (protectedHeader: any) => Promise<CryptoKey>,
): Promise<{ payload: T; protectedHeader: any }> {
  // Split the token into header, payload, and signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header and payload
  const headerJson = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'));
  const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));

  const header = JSON.parse(headerJson);
  const payload = JSON.parse(payloadJson) as T;

  // Get the key for verification
  const key = await getKey(header);

  // Verify the signature
  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToArrayBuffer(signatureB64);

  // Use appropriate algorithm based on header
  const algorithm = {
    name: header.alg === 'RS256' ? 'RSASSA-PKCS1-v1_5' : 'HMAC',
    hash: { name: header.alg.includes('256') ? 'SHA-256' : 'SHA-512' },
  };

  const isValid = await crypto.subtle.verify(
    algorithm,
    key,
    signature,
    signedData,
  );

  if (!isValid) {
    throw new Error('Invalid JWT signature');
  }

  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('JWT has expired');
  }

  return { payload, protectedHeader: header };
}

/**
 * Converts a base64url string to an ArrayBuffer
 */
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}
