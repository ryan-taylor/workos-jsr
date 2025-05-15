/**
 * Logout Route Handler
 *
 * This route demonstrates session destruction (logout) in Fresh 2.x.
 * It receives a POST request, clears the session data, and redirects to the login page.
 */
import { FreshContext } from "../workos_internal/server.ts";

export async function POST(_req: Request, ctx: FreshContext) {
  // Call the clearSession method to destroy the session (SESSION DESTRUCTION)
  // @ts-ignore - Ignoring TypeScript errors due to dynamic state
  await ctx.state.workos.clearSession();

  // Redirect to login page after session is destroyed
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" },
  });
}
