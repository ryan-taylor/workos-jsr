/// <reference lib="deno.unstable" />

import type { Cookie } from "https://deno.land/std@0.220.0/http/cookie.ts";
// Use a type definition instead of direct import to avoid URL resolution issues
type FreshContext = {
  next: () => Promise<Response>;
  state: Record<string, unknown>;
};
import { FreshSessionProvider } from "./fresh-session-provider.ts";
import type {
  SessionOptions,
  UnsealedDataType,
} from "./fresh-session-provider.ts";

/**
 * KVSessionProvider extends FreshSessionProvider to store session data in Deno KV
 * while using a small reference cookie to identify the session.
 */
export class KVSessionProvider extends FreshSessionProvider {
  private kv: Deno.Kv | null = null;
  private initialized = false;

  /**
   * Initialize the KV session provider
   */
  constructor() {
    super();
  }

  /**
   * Initialize the KV connection
   * Must be called before using any methods that interact with KV
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.kv = await Deno.openKv();
      this.initialized = true;
    }
  }

  /**
   * Get a KV key for a session ID
   * @param sessionId The session ID
   * @returns A key for the KV store
   */
  private getSessionKey(sessionId: string): Deno.KvKey {
    return ["sessions", sessionId];
  }

  /**
   * Get session data from the KV store
   * @param req The request object
   * @param options Session options
   * @returns Promise resolving to the session data or null if no session
   */
  override async getSession<T = UnsealedDataType>(
    req: Request,
    options: SessionOptions,
  ): Promise<T | null> {
    const { cookieName } = options;
    const cookieStr = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};

    cookieStr.split(";").forEach((pair) => {
      const [name, ...rest] = pair.trim().split("=");
      if (name) {
        cookies[name] = rest.join("=");
      }
    });

    const sessionId = cookies[cookieName];

    if (!sessionId) {
      return null;
    }

    try {
      // Initialize KV connection if needed
      await this.initialize();

      if (!this.kv) {
        throw new Error("Failed to initialize KV store");
      }

      // Get session from KV store
      const sessionEntry = await this.kv.get<T>(this.getSessionKey(sessionId));
      return sessionEntry.value;
    } catch (error) {
      console.error("Error retrieving session from KV:", error);
      // If reading fails, return null (invalid or expired session)
      return null;
    }
  }

  /**
   * Create a new response with session data stored in KV
   * @param data The session data to store
   * @param options Session options
   * @param response Optional response to modify (creates new response if not provided)
   * @returns A new response with the session cookie set
   */
  override async createSessionResponse(
    data: Record<string, unknown>,
    options: SessionOptions,
    response?: Response,
  ): Promise<Response> {
    const {
      cookieName,
      ttl = 86400 * 7, // Default 7 days
      cookiePath = "/",
      secure = true,
      httpOnly = true,
      sameSite = "Lax",
      domain,
    } = options;

    // Generate a random session ID
    const sessionId = crypto.randomUUID();

    try {
      // Initialize KV connection if needed
      await this.initialize();

      if (!this.kv) {
        throw new Error("Failed to initialize KV store");
      }

      // Store data in KV with expiration
      await this.kv.set(
        this.getSessionKey(sessionId),
        data,
        { expireIn: ttl * 1000 }, // KV expiration is in milliseconds
      );
    } catch (error) {
      console.error("Error storing session in KV:", error);
      // Continue even if KV storage fails, as we can still set the cookie
    }

    // Create the cookie with the session ID
    const cookie: Cookie = {
      name: cookieName,
      value: sessionId,
      path: cookiePath,
      secure,
      httpOnly,
      sameSite,
      maxAge: ttl,
    };

    if (domain) {
      cookie.domain = domain;
    }

    // Serialize cookie manually since we can't access the private serializeCookie method
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
   * Destroy the session by removing it from KV and clearing the cookie
   * This properly overrides the parent class method
   * @param options Session options
   * @param response Optional response to modify
   * @returns A response with the session cookie cleared
   */
  override destroySession(
    options: SessionOptions,
    response?: Response,
  ): Response {
    // Since we can't access cookies from a response directly,
    // we'll just rely on clearing the cookie
    // KV entries will eventually expire based on TTL

    return super.destroySession(options, response);
  }

  /**
   * Destroy session with request context
   * @param options Session options
   * @param req Request to get session ID from
   * @param response Optional response to modify
   * @returns Response with session cleared
   */
  async destroySessionWithRequest(
    options: SessionOptions,
    req: Request,
    response?: Response,
  ): Promise<Response> {
    const { cookieName } = options;
    const cookieStr = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};

    cookieStr.split(";").forEach((pair) => {
      const [name, ...rest] = pair.trim().split("=");
      if (name) {
        cookies[name] = rest.join("=");
      }
    });

    const sessionId = cookies[cookieName];

    // Delete from KV if session exists
    if (sessionId) {
      try {
        // Initialize KV connection if needed
        await this.initialize();

        if (!this.kv) {
          throw new Error("Failed to initialize KV store");
        }

        await this.kv.delete(this.getSessionKey(sessionId));
      } catch (error) {
        console.error("Error deleting session from KV:", error);
        // Continue even if KV deletion fails, as we can still clear the cookie
      }
    }

    // Return response with cleared cookie
    return super.destroySession(options, response);
  }

  /**
   * Create Fresh 2.x middleware for KV-backed session management
   * @param options Session options
   * @returns A Fresh middleware handler
   */
  override createSessionMiddleware(options: SessionOptions) {
    return {
      handler: async (req: Request, ctx: FreshContext) => {
        // Get the session from the request
        const session = await this.getSession(req, options);

        // Add session to state for handler access
        ctx.state.session = session || {};

        // Store the original session state to detect changes
        const originalSession = JSON.stringify(ctx.state.session);

        // Process the request
        const response = await ctx.next();

        // Check if session was modified
        const currentSession = JSON.stringify(ctx.state.session);

        if (currentSession !== originalSession) {
          // Session was modified, update in KV store
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
}
