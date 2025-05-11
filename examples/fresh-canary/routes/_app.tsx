import type { AppProps, Handlers, PageProps } from '$fresh/server.ts';
import { getCurrentUser, type WorkOSUser } from '../utils/user-management.ts';
import { AuthProvider } from '../utils/auth-context.tsx';

// Define the data structure for the app
export interface AppData {
  user: WorkOSUser | null;
}

export const handler: Handlers<AppData> = {
  async GET(req, ctx) {
    // Get current user from session if available
    const user = await getCurrentUser(req);

    // Pass the user data to the component
    return ctx.render({ user });
  },
};

export default function App({ Component, data }: AppProps<AppData>) {
  const { user } = data || { user: null };
  const isAuthenticated = !!user;

  return (
    <html lang="en">
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name="description" content="WorkOS integration with Fresh 2.x Canary" />
        <title>WorkOS + Fresh Example</title>
        <link rel='stylesheet' href='/styles.css' />
      </head>
      <body>
        <header>
          <nav>
            <ul>
              <li>
                <a href='/'>Home</a>
              </li>
              {!isAuthenticated
                ? (
                  <li>
                    <a href='/login'>Login</a>
                  </li>
                )
                : (
                  <>
                    <li>
                      <a href='/protected'>Protected Page</a>
                    </li>
                    <li>
                      <a href='/account'>My Account</a>
                    </li>
                    <li>
                      <a href='/examples/auth-context'>Auth Context Demo</a>
                    </li>
                    <li>
                      <a href='/logout'>Logout</a>
                    </li>
                  </>
                )}
            </ul>
          </nav>
          {isAuthenticated && user && (
            <div class='user-banner'>
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
