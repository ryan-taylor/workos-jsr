/**
 * Fresh Session Provider Module
 *
 * This module provides a session management implementation that's compatible with
 * both Fresh 1.x and 2.x. It implements secure cookie-based sessions using
 * iron-session patterns with encryption.
 */

import type { Cookie } from "jsr:@std/http@1/cookie";

/**
 * Options for sealing (encrypting) session data
 *
 * @property password - Either a single password string or a map of password IDs to passwords
 *                      Using a map allows for password rotation without breaking existing sessions
 * @property ttl - Optional time-to-live in seconds for the sealed data
 */
export type SealDataOptions = {
  password: string | { [id: string]: string };
  ttl?: number;
};
/**
 * Represents unsealed (decrypted) session data
 *
 * This is a generic type that can store any JSON-serializable data
 * in the session. The session implementation will serialize/deserialize
 * this data when storing/retrieving from cookies.
 */
export type UnsealedDataType = Record<string, unknown>;
/**
 * Universal Fresh context interface that works with both Fresh 1.x and 2.x
 *
 * This is defined locally instead of importing from Fresh to avoid version dependencies.
 * It includes the common properties needed for session management across both versions:
 * - state: An object to store session and other state data during request processing
 * - next: A function to call the next handler in the middleware chain
 *
 * Using this universal interface allows the middleware to work with either
 * Fresh version without code changes.
 */
export interface FreshContext {
  state: Record<string, unknown>;
  next: () => Promise<Response>;
}

/**
 * Session configuration options
 *
 * These options configure both the session behavior and the underlying
 * cookie properties. The interface is designed to be compatible with
 * Fresh 2.x session management patterns while maintaining backward
 * compatibility with Fresh 1.x.
 */
export interface SessionOptions {
  /** The cookie name used to store the session */
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
 * FreshSessionProvider implements session management for Fresh applications
 *
 * This class provides:
 * 1. Secure cookie-based session management with encryption
 * 2. Compatibility with both Fresh 1.x and 2.x session patterns
 * 3. Middleware that automatically detects session changes
 *
 * The implementation uses the Web Crypto API for secure session data
 * encryption and follows best practices for cookie management.
 */
export class FreshSessionProvider {
  constructor() {
    // No initialization needed
  }

  /**
   * Seals (encrypts) data for secure storage in cookies
   *
   * This method:
   * 1. Converts the data to JSON
   * 2. Encrypts it using AES-GCM with a key derived from the password
   * 3. Formats the result for safe storage in a cookie
   *
   * The encryption prevents clients from tampering with session data
   * while still allowing the server to retrieve and modify it securely.
   *
   * @param data The data to seal (any JSON-serializable object)
   * @param options Options including the password for encryption
   * @returns A promise that resolves to the sealed data string (base64-encoded)
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
   * Unseals (decrypts) data from a secure cookie
   *
   * This method:
   * 1. Decodes the base64 sealed data
   * 2. Extracts the IV and encrypted content
   * 3. Decrypts using the same password-derived key
   * 4. Parses the JSON back to the original data structure
   *
   * This is the counterpart to sealData() and allows retrieving
   * session data that was previously stored in a cookie.
   *
   * @param seal The sealed data string (base64-encoded)
   * @param options Options including the password for decryption
   * @returns A promise that resolves to the unsealed data of type T
   * @throws Error if decryption fails (invalid data or wrong password)
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
   * Retrieves session data from a request's cookies
   *
   * This method:
   * 1. Extracts cookies from the request
   * 2. Finds the session cookie by name
   * 3. Attempts to unseal (decrypt) the cookie value
   * 4. Returns the session data or null if no valid session exists
   *
   * This is typically used at the beginning of request processing
   * to make session data available to handlers.
   *
   * @param req The HTTP request object
   * @param options Session configuration options
   * @returns Promise resolving to the session data or null if no valid session exists
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
   * Creates a response with session data stored in a cookie
   *
   * This method:
   * 1. Seals (encrypts) the provided session data
   * 2. Creates a cookie with the encrypted data and proper security settings
   * 3. Adds the cookie to a new response or modifies an existing one
   *
   * This is typically used at the end of request processing to
   * persist any changes made to the session during handling.
   *
   * @param data The session data to store
   * @param options Session configuration options
   * @param response Optional existing response to modify
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
   * Creates a response that clears the session cookie
   *
   * This method:
   * 1. Creates an expired cookie with the same name and path
   * 2. Adds the cookie to a new response or modifies an existing one
   *
   * This is used to implement logout functionality or to clear invalid sessions.
   *
   * @param options Session configuration options
   * @param response Optional existing response to modify
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
   * Creates a Fresh 2.x compatible middleware for session management
   *
   * This method implements the adapter pattern for Fresh 2.x middleware:
   * 1. Returns an object with a handler property (Fresh 2.x format)
   * 2. The handler retrieves the session from the request
   * 3. Adds session data to the context state
   * 4. Detects changes to the session during request processing
   * 5. Automatically persists changes in the response
   *
   * This is a key part of the Fresh 2.x compatibility implementation,
   * making session management work seamlessly with the new middleware structure.
   *
   * @param options Session configuration options
   * @returns A Fresh 2.x compatible middleware object
   */
  createSessionMiddleware(
    options: SessionOptions,
  ): { handler: (req: Request, ctx: FreshContext) => Promise<Response> } {
    // This returns the Fresh 2.x middleware format (object with handler property)
    // Use arrow function to preserve 'this' context
    return {
      handler: async (req: Request, ctx: FreshContext) => {
        // Get the session from the request cookies and decrypt it
        const session = await this.getSession(req, options);

        // Add session to state for handler access
        // This makes session data available via ctx.state.session
        // Works with both Fresh 1.x and 2.x context state management
        ctx.state.session = session || {};
        // Store the original session state to detect changes during request processing
        // This is used to determine if the session cookie needs to be updated
        const originalSession = JSON.stringify(ctx.state.session);

        // Process the request by calling the next middleware or route handler
        // This allows the route handler to access and modify the session
        const response = await ctx.next();

        // Check if session was modified during request processing
        // by comparing the stringified objects before and after
        const currentSession = JSON.stringify(ctx.state.session);

        if (currentSession !== originalSession) {
          // Session was modified, update the cookie in the response
          // This automatic change detection and persistence is a key feature
          // that works consistently across Fresh 1.x and 2.x
          return await this.createSessionResponse(
            ctx.state.session as Record<string, unknown>,
            options,
            response,
          );
        }

        return response;
      },
    };
  }

  /**
   * Parses cookies from a request's headers
   *
   * This is a utility method that extracts cookies from the Cookie header
   * and returns them as a key-value object. Used internally by getSession().
   *
   * @param req The HTTP request object
   * @returns An object containing all cookies as key-value pairs
   * @private Internal utility method
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
   * Serializes a cookie object to a string for the Set-Cookie header
   *
   * This utility method converts a Cookie object with its properties into
   * the string format required for the Set-Cookie HTTP header.
   *
   * @param cookie The cookie object with name, value, and options
   * @returns A string representation of the cookie for the Set-Cookie header
   * @private Internal utility method
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
   * Creates cryptographic key material from a password string
   *
   * This method imports the password as raw key material that can be used
   * for further key derivation. It's part of the encryption process.
   *
   * @param password The password string to derive key material from
   * @returns A promise that resolves to a CryptoKey for PBKDF2
   * @private Internal crypto utility method
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
   * Derives an AES-GCM encryption key from key material
   *
   * This method uses PBKDF2 with a fixed salt to derive a deterministic
   * encryption key from the password material. The derived key is used for
   * both encryption and decryption of session data.
   *
   * @param keyMaterial The base key material from getKeyMaterial()
   * @returns A promise that resolves to an AES-GCM CryptoKey
   * @private Internal crypto utility method
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
