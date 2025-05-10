import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { initUserManagement, createUserSession } from "../utils/user-management.ts";

interface LoginData {
  authorizationURL?: string;
  error?: string;
  redirectTo?: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    const redirectTo = url.searchParams.get("redirect") || "/protected";
    
    // Initialize WorkOS client
    const { workos } = initUserManagement();
    
    // Get the authorization URL for SSO
    const authorizationURL = workos.sso.getAuthorizationUrl({
      clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
      redirectUri: new URL("/callback", req.url).toString(),
      connection: url.searchParams.get("connection") || undefined,
      state: crypto.randomUUID(),
    });
    
    return ctx.render({
      authorizationURL,
      error: error || undefined,
      redirectTo
    });
  },
  
  async POST(req, ctx) {
    try {
      const url = new URL(req.url);
      const redirectTo = url.searchParams.get("redirect") || "/protected";
      
      // Parse form data
      const form = await req.formData();
      const email = form.get("email")?.toString();
      const password = form.get("password")?.toString();
      
      if (!email || !password) {
        return ctx.render({
          error: "Email and password are required"
        });
      }
      
      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();
      
      // Authenticate with password
      const authResponse = await userManagement.authenticateWithPassword({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        email,
        password,
        session: {
          sealSession: true,
          cookiePassword: Deno.env.get("SESSION_SECRET") || "use-a-strong-password-in-production",
        }
      });
      
      if (!authResponse.user) {
        return ctx.render({ error: "Authentication failed" });
      }
      
      // Create session from authentication response
      return await createUserSession(
        {
          user: {
            id: authResponse.user.id,
            email: authResponse.user.email,
            firstName: authResponse.user.firstName,
            lastName: authResponse.user.lastName,
            profilePictureUrl: authResponse.user.profilePictureUrl,
          },
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
        },
        redirectTo
      );
      
    } catch (error) {
      console.error("Login error:", error);
      return ctx.render({
        error: error instanceof Error ? error.message : "Authentication failed"
      });
    }
  }
};

// Import the LoginForm island component
import LoginForm from "../islands/LoginForm.tsx";

export default function Login({ data }: PageProps<LoginData>) {
  return <LoginForm
    authorizationURL={data.authorizationURL}
    error={data.error}
    redirectTo={data.redirectTo}
  />;
}