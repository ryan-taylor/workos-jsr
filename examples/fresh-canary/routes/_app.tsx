import { AppProps } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import {
  getCurrentUser,
  WorkOSUser,
  SESSION_OPTIONS
} from "../utils/user-management.ts";
import { FreshSessionProvider } from "../../../src/common/iron-session/fresh-session-provider.ts";
import { AuthProvider } from "../utils/auth-context.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Get current user from session if available
    const user = await getCurrentUser(req);
    
    // Pass the user data to the component
    return ctx.render({ user });
  },
};

export default function App({ Component, data }: AppProps<{ user?: WorkOSUser }>) {
  const { user } = data || {};
  const isAuthenticated = !!user;
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WorkOS + Fresh Example</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              {!isAuthenticated ? (
                <li><a href="/login">Login</a></li>
              ) : (
                <>
                  <li><a href="/protected">Protected Page</a></li>
                  <li><a href="/account">My Account</a></li>
                  <li><a href="/examples/auth-context">Auth Context Demo</a></li>
                  <li><a href="/logout">Logout</a></li>
                </>
              )}
            </ul>
          </nav>
          {isAuthenticated && (
            <div class="user-banner">
              Welcome, {user.firstName || user.email}
            </div>
          )}
        </header>
        <main>
          {/* Wrap the app in the AuthProvider */}
          <AuthProvider initialUser={user}>
            <Component />
          </AuthProvider>
        </main>
        <footer>
          <p>WorkOS + Fresh 2.x Canary Example</p>
        </footer>
      </body>
    </html>
  );
}