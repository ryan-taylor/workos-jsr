/** @jsx h */
import { h } from "preact";
import { FreshContext } from "../workos_internal/server.ts";
import SessionStatus from "../components/SessionStatus.tsx";

/**
 * Dashboard Page
 *
 * This page demonstrates session handling in Fresh 2.x:
 * 1. Session verification - checks if user is logged in
 * 2. Session reading - displays user information from session
 * 3. Session modification - allows adding custom data
 * 4. Session destruction - provides logout functionality
 */
export default async function DashboardPage(_req: Request, ctx: FreshContext) {
  // Get session data using the session helper (SESSION READING)
  // @ts-ignore - Ignoring TypeScript errors due to dynamic state
  const session = await ctx.state.workos.getSession();

  // Redirect to login if no session exists (protection)
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  // Handle POST requests to update session data
  if (_req.method === "POST") {
    try {
      const formData = await _req.formData();
      const key = formData.get("key")?.toString();
      const value = formData.get("value")?.toString();

      if (key && value) {
        // Use the session update helper to modify data (SESSION MODIFICATION)
        // @ts-ignore - Ignoring TypeScript errors due to dynamic state
        await ctx.state.workos.updateSession({ [key]: value });
      }

      // Refresh the page to show updated session data
      return new Response(null, {
        status: 303, // See Other
        headers: { Location: "/dashboard" },
      });
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  }

  // Function to handle session updates from client-side
  const handleSessionUpdate = async (data: Record<string, unknown>) => {
    // @ts-ignore - Ignoring TypeScript errors due to dynamic state
    await ctx.state.workos.updateSession(data);
    return;
  };

  return (
    <div class="p-4 max-w-4xl mx-auto">
      <div class="mb-6 border-b pb-4">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-gray-600">
          Welcome,{" "}
          {session.profile?.email || "User"}! You are successfully logged in
          using WorkOS SSO.
        </p>
      </div>

      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-3">Session Management Demo</h2>
        <p class="text-gray-600 mb-4">
          This example demonstrates the complete session lifecycle in Fresh 2.x:
        </p>
        <ul class="list-disc list-inside text-gray-600 mb-4 ml-4">
          <li>Creating a session (happened during login)</li>
          <li>Reading session data (displaying below)</li>
          <li>Modifying session data (try adding custom data)</li>
          <li>Destroying a session (click logout)</li>
        </ul>
      </div>

      {/* Session Status Component shows the current session state */}
      <SessionStatus
        session={session}
        onUpdate={handleSessionUpdate}
      />

      {/* Manual form for session updates (alternative to client-side approach) */}
      <div class="mt-8 border-t pt-4">
        <h2 class="text-xl font-semibold mb-3">Form-Based Session Update</h2>
        <p class="text-gray-600 mb-4">
          You can also update the session using a standard form submission:
        </p>
        <form method="POST" class="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="text"
            name="key"
            placeholder="Key"
            class="border p-2 flex-1"
            required
          />
          <input
            type="text"
            name="value"
            placeholder="Value"
            class="border p-2 flex-1"
            required
          />
          <button
            type="submit"
            class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
}
