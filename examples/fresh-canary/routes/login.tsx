/**
 * Login Page
 *
 * This route demonstrates the beginning of the session lifecycle
 * by initiating the authentication flow, which will create a session
 * after successful authentication.
 */
import { FreshContext } from "../workos_internal/server.ts";
/** @jsx h */
import { h } from "preact";

export default function LoginPage(req: Request, ctx: FreshContext) {
  // Ensure WorkOS is properly initialized
  // @ts-ignore - Ignoring TypeScript errors due to dynamic state
  if (!ctx.state.workos) {
    throw new Error("WorkOS not initialized in context");
  }

  // Get the authorization URL for OAuth flow
  // @ts-ignore - Ignoring TypeScript errors due to dynamic state
  const loginUrl = ctx.state.workos.sso.getAuthorizationURL({
    provider: "google",
    redirectUri: new URL("/callback", req.url).toString(),
  });

  return (
    <div class="p-4 max-w-md mx-auto mt-10">
      <h1 class="text-2xl font-bold mb-6">Login</h1>

      <div class="bg-gray-50 p-4 rounded-md border mb-6">
        <h2 class="text-lg font-semibold mb-2">Session Lifecycle Demo</h2>
        <p class="text-sm text-gray-600 mb-2">
          This example demonstrates the complete session lifecycle in Fresh 2.x:
        </p>
        <ol class="list-decimal list-inside text-sm text-gray-600 ml-2">
          <li>Creating a session (starts here)</li>
          <li>Reading session data</li>
          <li>Modifying session data</li>
          <li>Destroying a session (logout)</li>
        </ol>
      </div>

      {/* Login button initiates the session creation process */}
      <a
        href={loginUrl}
        class="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
      >
        Continue with Google
      </a>

      <div class="mt-6 text-sm text-gray-500">
        <p>
          Clicking the button above will start the authentication flow. After
          successful authentication, a session will be created.
        </p>
      </div>
    </div>
  );
}
