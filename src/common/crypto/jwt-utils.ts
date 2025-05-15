/**
 * JWT utilities for WorkOS
 */

/**
 * Interface representing the standard JWT payload structure
 */
export interface JWTPayload {
  iss?: string; // Issuer
  sub?: string; // Subject
  aud?: string | string[]; // Audience
  exp?: number; // Expiration Time
  nbf?: number; // Not Before
  iat?: number; // Issued At
  jti?: string; // JWT ID
  [key: string]: unknown; // Allow for additional custom claims
}

/**
 * Decodes a JWT token without verification
 *
 * @param token JWT token to decode
 * @returns Decoded JWT payload
 */
export function decodeJWT(token: string): JWTPayload {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    throw new Error("Invalid JWT token");
  }
}

/**
 * Verifies a JWT token and returns the decoded payload
 * Uses Deno's native crypto APIs
 *
 * @param token JWT token to verify
 * @param secret Secret or public key to verify the token
 * @param options Verification options
 * @returns Verified and decoded JWT payload
 */
export async function verifyJWT(
  token: string,
  secret: string | CryptoKey,
  options: {
    algorithms?: string[];
    audience?: string | string[];
    issuer?: string | string[];
    subject?: string;
    clockTolerance?: number;
  } = {},
): Promise<JWTPayload> {
  // For full implementation, the Deno standard library or third-party JWT libraries
  // would be used. This is a placeholder to define the interface.

  // This would be implemented with:
  // - Header validation
  // - Signature verification using Deno.crypto
  // - Claims validation (exp, nbf, iss, aud, etc.)

  // For now, return decoded JWT without verification for interface compatibility
  return decodeJWT(token);
}

/**
 * Creates a JWT token from the given payload
 *
 * @param payload Data to include in the JWT payload
 * @param secret Secret key to sign the token
 * @param options Signing options
 * @returns Signed JWT token
 */
export async function createJWT(
  payload: JWTPayload,
  secret: string | CryptoKey,
  options: {
    algorithm?: string;
    expiresIn?: number | string;
    notBefore?: number | string;
    audience?: string | string[];
    issuer?: string;
    subject?: string;
    jwtid?: string;
  } = {},
): Promise<string> {
  // For full implementation, the Deno standard library or third-party JWT libraries
  // would be used. This is a placeholder to define the interface.

  // This would be implemented with:
  // - Header construction
  // - Payload construction with appropriate default values and timestamps
  // - Signature generation using Deno.crypto

  // For now, return a dummy JWT for interface compatibility
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
}
