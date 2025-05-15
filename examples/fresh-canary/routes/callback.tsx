/**
 * OAuth Callback Handler
 *
 * This route completes the authentication flow and demonstrates
 * session creation (the first step in the session lifecycle).
 * After verifying the authentication code, it creates a session
 * with the user's profile information.
 */
/** @jsx h */
import { h } from "preact";
import { FreshContext } from "../workos_internal/server.ts";

export default async function CallbackPage(req: Request, ctx: FreshContext) {
  // Extract authentication code from query parameters
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return new Response("No authentication code provided", { status: 400 });
  }

  try {
    // Exchange the code for a user profile (authenticate user)
    // @ts-ignore - Ignoring TypeScript errors due to dynamic state
    const profile = await ctx.state.workos.sso.getProfileAndToken(code);

    // Create a session with the user's profile (SESSION CREATION)
    // @ts-ignore - Ignoring TypeScript errors due to dynamic state
    await ctx.state.workos.setSession(profile);

    // Log session creation for debugging
    console.log(
      `Session created for user: ${profile.profile?.email || "Unknown user"}`,
    );

    // Redirect to dashboard where the session can be read and modified
    return new Response(null, {
      status: 302,
      headers: { Location: "/dashboard" },
    });
  } catch (error) {
    // Handle authentication errors
    console.error("Authentication error:", error);

    // Return user-friendly error response
    return new Response(
      `<html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 500px; margin: 0 auto; }
            .error { background: #fff5f5; border: 1px solid #feb2b2; padding: 1rem; border-radius: 4px; }
            h1 { font-size: 1.5rem; margin-top: 0; }
            a { color: #3182ce; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <div class="error">
            <p>We encountered an error while trying to authenticate you.</p>
            <p>Error details: ${
        error instanceof Error ? error.message : "Unknown error"
      }</p>
          </div>
          <p><a href="/login">← Return to login page</a></p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}
