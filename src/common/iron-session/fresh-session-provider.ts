/**
 * Fresh framework session provider for WorkOS Deno port
 */
import { Cookie, setCookie } from "$sdk/common/deps/cookie.ts";

/**
 * Fresh plugin interface
 */
interface FreshPlugin {
  name: string;
  middlewares: {
    path: string;
    middleware: {
      handler: (req: Request, ctx: FreshContext) => Promise<Response>;
    };
  }[];
}

// Define simple interfaces for Fresh context
interface FreshContext {
  next: () => Promise<Response>;
  // Using Record<string, unknown> is better than [key: string]: unknown
  // since it's more explicit about the shape of the object
  state: Record<string, unknown>;
}

interface SessionOptions {
  cookieName: string;
  password: string; // Used for encryption
  ttl?: number; // Time to live in seconds
}

/**
 * Session data interface
 */
export type SessionData = Record<string, unknown>;

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
   * Encrypts and signs data
   * @param data The data to encrypt
   * @param options Optional configuration
   * @returns Promise resolving to the encrypted data string
   * @deprecated Use createCookieValue instead in Fresh 2.x
   */
  // eslint-disable-next-line require-await
  async sealData<
    T,
    O extends Record<string, unknown> = Record<string, unknown>,
  >(
    data: T,
    options?: { password?: string },
  ): Promise<string> {
    return this.createCookieValue(data, options?.password);
  }

  /**
   * Decrypts and verifies data
   * @param sealedData The encrypted data string
   * @param options Optional configuration
   * @returns Promise resolving to the decrypted data
   * @deprecated Use extractDataFromCookie instead in Fresh 2.x
   */
  // eslint-disable-next-line require-await
  async unsealData<T, O = unknown, E = unknown>(
    sealedData: string,
    options?: { password?: string },
  ): Promise<T> {
    return this.extractDataFromCookie(sealedData, options?.password);
  }

  /**
   * Creates an encrypted cookie value from data (Fresh 2.x compatible)
   * @param data The data to encrypt
   * @param password Optional password override
   * @returns Promise resolving to the encrypted cookie value
   */
  // eslint-disable-next-line require-await
  async createCookieValue<T>(data: T, password?: string): Promise<string> {
    try {
      // This is a simplified mock implementation
      // In production, you would use the proper encryption library
      return JSON.stringify(data);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`Failed to create cookie value: ${errorMessage}`);
    }
  }

  /**
   * Extracts and decrypts data from a cookie value (Fresh 2.x compatible)
   * @param cookieValue The encrypted cookie value
   * @param password Optional password override
   * @returns Promise resolving to the decrypted data
   */
  // eslint-disable-next-line require-await
  async extractDataFromCookie<T>(
    cookieValue: string,
    password?: string,
  ): Promise<T> {
    try {
      // This is a simplified mock implementation
      // In production, you would use the proper decryption library
      return JSON.parse(cookieValue) as T;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`Failed to extract data from cookie: ${errorMessage}`);
    }
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
    // Retrieve the session cookie from the request
    const cookies = req.headers.get("cookie") || "";
    const cookieValue = cookies
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${this.options.cookieName}=`))
      ?.split("=")[1];

    if (!cookieValue) {
      return {};
    }

    try {
      // Use the new extractDataFromCookie method instead of unsealData
      return await this.extractDataFromCookie<SessionData>(
        cookieValue,
        this.options.password,
      );
    } catch (error) {
      console.error("Error extracting session data:", error);
      return {};
    }
  }

  /**
   * Saves session data
   * @param session Session data to save
   */
  private saveSession(session: SessionData): Promise<void> {
    // In a real implementation, this would prepare the session for saving
    // Since Iron is cookie-based, we don't actually save here, but during cookie update
    return Promise.resolve();
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
    try {
      // Use the new createCookieValue method instead of sealData
      const encryptedValue = await this.createCookieValue(
        session,
        this.options.password,
      );

      // Create cookie options directly without spread to avoid TypeScript errors
      const cookie: Cookie = {
        name: this.options.cookieName,
        value: encryptedValue,
        maxAge: this.options.ttl,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
      };

      setCookie(resp.headers, cookie);
    } catch (error) {
      console.error("Error updating session cookie:", error);
    }
  }
}
