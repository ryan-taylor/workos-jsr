import type { Cookie } from "jsr:@std/http@1/cookie";
import {
  createCompatibleMiddleware,
  ensureContextState,
  type FreshContext,
  type FreshMiddleware,
  type MiddlewareHandler,
} from "../utils/fresh-middleware-adapter.ts";
/**
 * Options for sealing session data
 */
export type SealDataOptions = {
  password: string | { [id: string]: string };
  ttl?: number;
};
/**
 * Represents unsealed session data
 */
export type UnsealedDataType = Record<string, unknown>;

// Note: We're now using the FreshContext from fresh-middleware-adapter.ts

/**
 * Interface for Fresh 2.x session options
 */
export interface SessionOptions {
  /** The cookie name */
  cookieName: string;
  /** Password used for encryption. Either a string or a record of password IDs to passwords */
  password: string | { [id: string]: string };
  /** Time to live in seconds */
  ttl?: number;
  /** Cookie path, defaults to '/' */
  cookiePath?: string;
  /** Whether the cookie is only sent to HTTPS, defaults to true */
  secure?: boolean;
  /** Whether the cookie is only accessible via HTTP(S) requests and not client JavaScript, defaults to true */
  httpOnly?: boolean;
  /** Whether the cookie is only sent in a first-party context, defaults to 'Lax' */
  sameSite?: "Strict" | "Lax" | "None";
  /** Forces the cookie to be set for this domain, defaults to current domain */
  domain?: string;
}

/**
 * FreshSessionProvider uses Fresh-Session for cookie management
 * and provides Fresh 2.x middleware support.
 */
export class FreshSessionProvider {
  constructor() {
    // No initialization needed
  }

  /**
   * Seals data using encryption
   * @param data The data to seal
   * @param options Options including the password for encryption
   * @returns A promise that resolves to the sealed data string
   */
  async sealData(data: unknown, options: SealDataOptions): Promise<string> {
    const { password } = options;

    // Ensure we have a single password string
    const passwordStr = typeof password === "string"
      ? password
      : Object.values(password)[0];

    if (!passwordStr) {
      throw new Error("Password is required for sealing data");
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data);

    // Convert string to bytes
    const dataBytes = new TextEncoder().encode(jsonData);

    // Create a key from the password
    const keyMaterial = await this.getKeyMaterial(passwordStr);
    const key = await this.deriveKey(keyMaterial);

    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBytes,
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage in a cookie
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Unseals data using decryption
   * @param seal The sealed data string
   * @param options Options including the password for decryption
   * @returns A promise that resolves to the unsealed data
   */
  async unsealData<T = UnsealedDataType>(
    seal: string,
    options: SealDataOptions,
  ): Promise<T> {
    const { password } = options;

    // Ensure we have a single password string
    const passwordStr = typeof password === "string"
      ? password
      : Object.values(password)[0];

    if (!passwordStr) {
      throw new Error("Password is required for unsealing data");
    }

    try {
      // Convert base64 to bytes
      const data = Uint8Array.from(atob(seal), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = data.slice(0, 12);
      const encryptedData = data.slice(12);

      // Create a key from the password
      const keyMaterial = await this.getKeyMaterial(passwordStr);
      const key = await this.deriveKey(keyMaterial);

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData,
      );

      // Convert bytes to string and parse JSON
      const jsonData = new TextDecoder().decode(decryptedData);
      return JSON.parse(jsonData) as T;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`Failed to unseal data: ${errorMessage}`);
    }
  }

  /**
   * Get session data from a request
   * @param req The request object
   * @param options Session options
   * @returns Promise resolving to the session data or null if no session
   */
  async getSession<T = UnsealedDataType>(
    req: Request,
    options: SessionOptions,
  ): Promise<T | null> {
    const { cookieName, password, ttl } = options;
    const cookies = this.parseCookies(req);
    const sessionCookie = cookies[cookieName];

    if (!sessionCookie) {
      return null;
    }

    try {
      return await this.unsealData<T>(sessionCookie, { password, ttl });
    } catch {
      // If unsealing fails, return null (invalid or expired session)
      return null;
    }
  }

  /**
   * Create a new response with session data
   * @param data The session data to store
   * @param options Session options
   * @param response Optional response to modify (creates new response if not provided)
   * @returns A new response with the session cookie set
   */
  async createSessionResponse(
    data: Record<string, unknown>,
    options: SessionOptions,
    response?: Response,
  ): Promise<Response> {
    const {
      cookieName,
      password,
      ttl = 86400 * 7, // Default 7 days
      cookiePath = "/",
      secure = true,
      httpOnly = true,
      sameSite = "Lax",
      domain,
    } = options;

    const sealed = await this.sealData(data, { password, ttl });
    const cookieValue = sealed;

    // Create the cookie with options
    const cookie: Cookie = {
      name: cookieName,
      value: cookieValue,
      path: cookiePath,
      secure,
      httpOnly,
      sameSite,
      maxAge: ttl,
    };

    if (domain) {
      cookie.domain = domain;
    }

    const cookieStr = this.serializeCookie(cookie);

    // Create or clone the response
    const baseResponse = response ? response.clone() : new Response(null);

    // Create headers for the new response
    const headers = new Headers(baseResponse.headers);
    headers.append("Set-Cookie", cookieStr);

    // Return a new response with the cookie header
    return new Response(baseResponse.body, {
      status: baseResponse.status,
      statusText: baseResponse.statusText,
      headers,
    });
  }

  /**
   * Create a response that clears the session cookie
   * @param options Session options
   * @param response Optional response to modify (creates new response if not provided)
   * @returns A new response with the session cookie cleared
   */
  destroySession(
    options: SessionOptions,
    response?: Response,
  ): Response {
    const {
      cookieName,
      cookiePath = "/",
      secure = true,
      httpOnly = true,
      sameSite = "Lax",
      domain,
    } = options;

    // Create an expired cookie to clear the session
    const cookie: Cookie = {
      name: cookieName,
      value: "",
      path: cookiePath,
      secure,
      httpOnly,
      sameSite,
      maxAge: 0,
      expires: new Date(0),
    };

    if (domain) {
      cookie.domain = domain;
    }

    const cookieStr = this.serializeCookie(cookie);

    // Create or clone the response
    const baseResponse = response ? response.clone() : new Response(null);

    // Create headers for the new response
    const headers = new Headers(baseResponse.headers);
    headers.append("Set-Cookie", cookieStr);

    // Return a new response with the cookie header
    return new Response(baseResponse.body, {
      status: baseResponse.status,
      statusText: baseResponse.statusText,
      headers,
    });
  }

  /**
   * Create a middleware handler for session management that works with both Fresh 1.x and 2.x
   *
   * Following Fresh 2.x compatibility requirements:
   * 1. Uses the object structure { handler: async (req, ctx) => Response } for Fresh 2.x
   * 2. Ensures proper context state access for sessions
   * 3. Implements updated session response handling flow
   *
   * @param options Session options
   * @returns A Fresh middleware compatible with the detected Fresh version
   */
  createSessionMiddleware(
    options: SessionOptions,
  ): FreshMiddleware {
    // Define the middleware handler function for both Fresh 1.x and 2.x
    const sessionHandler: MiddlewareHandler = async (
      req: Request,
      ctx: FreshContext,
    ) => {
      // Ensure context state exists, standardizing across Fresh versions
      const enhancedCtx = ensureContextState(ctx);

      // Get the session from the request
      const session = await this.getSession(req, options);

      // Add session to state for handler access - ensure it's in ctx.state as required by Fresh 2.x
      enhancedCtx.state.session = session || {};

      // Store the original session state to detect changes
      // This is critical for Fresh 2.x flow where we need to check for modifications
      const originalSession = JSON.stringify(enhancedCtx.state.session);

      // Process the request through the next middleware or route handler
      const response = await enhancedCtx.next();

      // Check if session was modified by comparing with original state
      // This follows the Fresh 2.x session response handling pattern
      const currentSession = JSON.stringify(enhancedCtx.state.session);

      if (currentSession !== originalSession) {
        // Session was modified, create a new response with updated session cookie
        return await this.createSessionResponse(
          enhancedCtx.state.session as Record<string, unknown>,
          options,
          response,
        );
      }

      // No changes to session, return original response
      return response;
    };

    // Use the compatibility adapter to return the appropriate middleware format
    // based on the detected Fresh version (1.x or 2.x)
    // This ensures we get { handler: fn } for Fresh 2.x or fn directly for Fresh 1.x
    return createCompatibleMiddleware(sessionHandler);
  }

  /**
   * Parse cookies from a request
   * @param req The request object
   * @returns An object containing all cookies
   */
  private parseCookies(req: Request): Record<string, string> {
    const cookieStr = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};

    cookieStr.split(";").forEach((pair) => {
      const [name, ...rest] = pair.trim().split("=");
      if (name) {
        cookies[name] = rest.join("=");
      }
    });

    return cookies;
  }

  /**
   * Serialize a cookie object to a string
   * @param cookie The cookie object
   * @returns A string representation of the cookie
   */
  private serializeCookie(cookie: Cookie): string {
    let cookieStr = `${cookie.name}=${cookie.value}`;

    if (cookie.expires) {
      cookieStr += `; Expires=${
        cookie.expires instanceof Date
          ? cookie.expires.toUTCString()
          : new Date(cookie.expires).toUTCString()
      }`;
    }

    if (typeof cookie.maxAge === "number") {
      cookieStr += `; Max-Age=${cookie.maxAge}`;
    }

    if (cookie.domain) {
      cookieStr += `; Domain=${cookie.domain}`;
    }

    if (cookie.path) {
      cookieStr += `; Path=${cookie.path}`;
    }

    if (cookie.secure) {
      cookieStr += "; Secure";
    }

    if (cookie.httpOnly) {
      cookieStr += "; HttpOnly";
    }

    if (cookie.sameSite) {
      cookieStr += `; SameSite=${cookie.sameSite}`;
    }

    return cookieStr;
  }

  /**
   * Creates key material from a password string
   * @param password The password string
   * @returns A promise that resolves to a CryptoKey
   */
  private async getKeyMaterial(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );
  }

  /**
   * Derives an AES-GCM key from key material
   * @param keyMaterial The key material
   * @returns A promise that resolves to a CryptoKey
   */
  private async deriveKey(keyMaterial: CryptoKey): Promise<CryptoKey> {
    // Use a fixed salt for deterministic key derivation
    const salt = new TextEncoder().encode("WorkOS-Fresh-Session-Salt");

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }
}
