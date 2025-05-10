import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { initUserManagement, createUserSession } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      // Get code from URL query params
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      
      if (!code) {
        return new Response("Authorization code is missing", { status: 400 });
      }
      
      // Initialize WorkOS client and User Management
      const { workos, userManagement } = initUserManagement();
      
      // Exchange code for profile and token with SSO
      const { profile, accessToken } = await workos.sso.getProfileAndToken({
        code,
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
      });
      
      // Authenticate with code to get user management tokens and information
      const authResponse = await userManagement.authenticateWithCode({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        code,
        session: {
          sealSession: true,
          cookiePassword: Deno.env.get("SESSION_SECRET") || "use-a-strong-password-in-production",
        }
      });
      
      // Create user object from profile/auth data
      const user = {
        id: authResponse.user?.id || profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePictureUrl: profile.profilePictureUrl,
      };
      
      // Create session from authentication response
      return await createUserSession(
        {
          user,
          accessToken: authResponse.accessToken || accessToken,
          refreshToken: authResponse.refreshToken,
        },
        "/protected"
      );
    } catch (error) {
      console.error("SSO authentication error:", error);
      
      // Redirect to login page with error
      return new Response(null, {
        status: 302,
        headers: { Location: "/login?error=authentication_failed" },
      });
    }
  },
};

export default function Callback({ data }: PageProps) {
  return (
    <div class="container">
      <h1>Processing Login...</h1>
      <p>Please wait while we authenticate your account.</p>
    </div>
  );
}