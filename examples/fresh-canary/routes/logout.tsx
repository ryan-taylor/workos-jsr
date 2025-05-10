import { Handlers } from "$fresh/server.ts";
import {
  SESSION_OPTIONS,
  initUserManagement,
  getCurrentUser
} from "../utils/user-management.ts";
import { FreshSessionProvider } from "../../../src/common/iron-session/fresh-session-provider.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      // Initialize session provider
      const sessionProvider = new FreshSessionProvider();
      
      // Get current user and session info from request
      const user = await getCurrentUser(req);
      const session = await sessionProvider.getSession(req, SESSION_OPTIONS);
      
      // Create a response that redirects to the home page
      const response = new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
      
      // Revoke the session with WorkOS if we have a session ID
      if (user && session?.accessToken) {
        try {
          const { userManagement } = initUserManagement();
          
          // First try to get a session object to retrieve the session ID
          const sessionObj = userManagement.loadSealedSession({
            sessionData: req.headers.get("cookie") || "",
            cookiePassword: SESSION_OPTIONS.password as string,
          });
          
          const authResponse = await sessionObj.authenticate();
          
          if (authResponse.authenticated && authResponse.sessionId) {
            // Revoke the session with WorkOS
            await userManagement.revokeSession({
              sessionId: authResponse.sessionId,
            });
          }
        } catch (error) {
          // If session revocation fails, we still want to destroy the local session
          console.error("Error revoking session:", error);
        }
      }
      
      // Clear the session cookie
      return sessionProvider.destroySession(SESSION_OPTIONS, response);
    } catch (error) {
      console.error("Logout error:", error);
      
      // Even if there's an error, still clear the session cookie
      const sessionProvider = new FreshSessionProvider();
      const response = new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
      
      return sessionProvider.destroySession(SESSION_OPTIONS, response);
    }
  },
};