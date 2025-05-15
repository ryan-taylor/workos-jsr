/**
 * Fresh framework session provider for WorkOS Deno port
 */

import { Cookie, setCookie } from "https://deno.land/std/http/cookie.ts";

// Define simple interfaces for Fresh context
interface FreshContext {
  next: () => Promise<Response>;
  [key: string]: unknown;
}

interface SessionOptions {
  cookieName: string;
  password: string; // Used for encryption
  ttl?: number; // Time to live in seconds
}

/**
 * Session data interface
 */
export interface SessionData {
  [key: string]: unknown;
}

/**
 * Context with session data
 */
export interface SessionContext extends FreshContext {
  session: SessionData;
  saveSession: () => Promise<void>;
}

/**
 * Session provider for Fresh framework using Iron
 * Iron provides secure, stateless, and encrypted cookies
 */
export class FreshSessionProvider {
  private readonly options: SessionOptions;

  constructor(options: SessionOptions) {
    if (!options.password || options.password.length < 32) {
      throw new Error("Password must be at least 32 characters long");
    }

    this.options = {
      ttl: 14 * 24 * 60 * 60, // 14 days by default
      ...options,
    };
  }

  /**
   * Creates a Fresh middleware plugin that manages session data
   * @returns Fresh middleware plugin
   */
  createPlugin(): unknown {
    return {
      name: "iron-session",
      middlewares: [
        {
          path: "/",
          middleware: {
            handler: async (
              req: Request,
              ctx: FreshContext,
            ): Promise<Response> => {
              // Extract session data from cookies
              const session = await this.getSession(req);

              // Add session to context
              const sessionCtx = ctx as SessionContext;
              sessionCtx.session = session;

              // Add save function to context
              sessionCtx.saveSession = async () => {
                await this.saveSession(session);
              };

              const resp = await ctx.next();

              // Update session cookie if session was modified
              const newResp = new Response(resp.body, resp);
              await this.updateSessionCookie(newResp, session);

              return newResp;
            },
          },
        },
      ],
    };
  }

  /**
   * Gets session data from request cookies
   * @param req Request object
   * @returns Session data
   */
  private async getSession(req: Request): Promise<SessionData> {
    // This would use Iron to decrypt the cookie data
    // For a real implementation, you would use a proper iron implementation
    // Here, we just return an empty session
    return {};
  }

  /**
   * Saves session data
   * @param session Session data to save
   */
  private async saveSession(session: SessionData): Promise<void> {
    // In a real implementation, this would prepare the session for saving
    // Since Iron is cookie-based, we don't actually save here, but during cookie update
  }

  /**
   * Updates the session cookie in the response
   * @param resp Response object
   * @param session Session data
   */
  private async updateSessionCookie(
    resp: Response,
    session: SessionData,
  ): Promise<void> {
    // This would use Iron to encrypt the session data
    // For a real implementation, you would encrypt the session and update the cookie

    // Create cookie options directly without spread to avoid TypeScript errors
    const cookie: Cookie = {
      name: this.options.cookieName,
      value: JSON.stringify(session), // In real implementation, this would be encrypted
      maxAge: this.options.ttl,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
    };

    setCookie(resp.headers, cookie);
  }
}
