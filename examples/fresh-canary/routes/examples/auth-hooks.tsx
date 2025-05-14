// Documentation page for auth hooks
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import { getAuthContextData } from "../../utils/auth-context.tsx";
import { AuthProvider } from "../../utils/auth-context.tsx";
import AuthStateDemo from "../../islands/AuthStateDemo.tsx";

export const handler = {
  async GET(req: Request, ctx: any) {
    const authData = await getAuthContextData(req);
    return ctx.render(authData);
  },
};

export default function AuthHooksPage(
  { data }: PageProps<{ user?: any | null }>,
) {
  const { user } = data;

  return (
    <>
      <Head>
        <title>Auth Hooks - WorkOS Fresh Example</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div className="container">
        <header>
          <h1>Authentication Hooks</h1>
          <p className="subtitle">
            Clean, reusable React hooks for auth state management
          </p>
        </header>

        <section className="content-section">
          <h2>Available Hooks</h2>

          <div className="hook-docs">
            <div className="hook-item">
              <h3>useAuthFunctions</h3>
              <p>Combines essential auth functionality in one hook</p>
              <pre className="code-block">
                {`
// Import the hook
import { useAuthFunctions } from "../utils/auth-hooks.ts";

// Use in your component
function MyComponent() {
  const {
    // User data
    user,                // Signal<WorkOSUser | null>
    isLoading,           // Signal<boolean>
    isAuthenticated,     // ReadonlySignal<boolean>

    // Refresh functionality
    refreshUser,         // () => Promise<void>
    isRefreshing,        // Signal<boolean>

    // Login functionality
    login,               // (redirectUrl?: string) => void
    isLoggingIn,         // Signal<boolean>
    loginError,          // Signal<string | null>

    // Logout functionality
    logout,              // () => void
    isLoggingOut,        // Signal<boolean>
    logoutError          // Signal<string | null>
  } = useAuthFunctions();

  // Now you can use these in your component
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useLogin</h3>
              <p>Focused hook for login functionality</p>
              <pre className="code-block">
                {`
import { useLogin } from "../utils/auth-hooks.ts";

function LoginComponent() {
  const {
    login,              // (redirectUrl?: string) => void
    isLoggingIn,        // Signal<boolean>
    loginError,         // Signal<string | null>
    isAuthenticated     // ReadonlySignal<boolean>
  } = useLogin();

  const handleLogin = () => {
    // Redirect to dashboard after login
    login("/dashboard");
  };
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useLogout</h3>
              <p>Focused hook for logout functionality</p>
              <pre className="code-block">
                {`
import { useLogout } from "../utils/auth-hooks.ts";

function LogoutButton() {
  const {
    logout,             // () => void
    isLoggingOut,       // Signal<boolean>
    logoutError,        // Signal<string | null>
    isAuthenticated     // ReadonlySignal<boolean>
  } = useLogout();

  return (
    <button
      onClick={logout}
      disabled={isLoggingOut.value}
    >
      {isLoggingOut.value ? "Logging out..." : "Log out"}
    </button>
  );
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useUserData</h3>
              <p>Hook for accessing and refreshing user data</p>
              <pre className="code-block">
                {`
import { useUserData } from "../utils/auth-hooks.ts";

function UserProfile() {
  const {
    user,               // Signal<WorkOSUser | null>
    isLoading,          // Signal<boolean>
    isAuthenticated,    // ReadonlySignal<boolean>
    error,              // Signal<string | null>
    refreshUser,        // () => Promise<void>
    isRefreshing        // Signal<boolean>
  } = useUserData();

  return (
    <div>
      {user.value && (
        <>
          <h2>Welcome, {user.value.firstName || user.value.email}</h2>
          <button onClick={refreshUser}>
            {isRefreshing.value ? "Refreshing..." : "Refresh Profile"}
          </button>
        </>
      )}
    </div>
  );
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useRegister</h3>
              <p>Hook for user registration</p>
              <pre className="code-block">
                {`
import { useRegister } from "../utils/auth-hooks.ts";

function RegistrationForm() {
  const {
    register,           // (userData) => Promise<boolean>
    isRegistering,      // Signal<boolean>
    registerError,      // Signal<string | null>
    registerSuccess     // Signal<boolean>
  } = useRegister();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Get form data
    const formData = new FormData(e.target);

    await register({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName")
    });
  };
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>usePasswordReset</h3>
              <p>Hook for requesting password reset</p>
              <pre className="code-block">
                {`
import { usePasswordReset } from "../utils/auth-hooks.ts";

function PasswordResetRequestForm() {
  const {
    requestReset,       // (email: string) => Promise<boolean>
    isRequesting,       // Signal<boolean>
    requestError,       // Signal<string | null>
    requestSuccess      // Signal<boolean>
  } = usePasswordReset();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    await requestReset(email);
  };
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useResetPasswordConfirm</h3>
              <p>Hook for confirming password reset with new password</p>
              <pre className="code-block">
                {`
import { useResetPasswordConfirm } from "../utils/auth-hooks.ts";

function PasswordResetConfirmForm() {
  const {
    confirmReset,       // (token: string, password: string) => Promise<boolean>
    isConfirming,       // Signal<boolean>
    confirmError,       // Signal<string | null>
    confirmSuccess      // Signal<boolean>
  } = useResetPasswordConfirm();

  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;

    if (token) {
      await confirmReset(token, password);
    }
  };
}`}
              </pre>
            </div>

            <div className="hook-item">
              <h3>useEmailVerification</h3>
              <p>Hook for verifying email addresses</p>
              <pre className="code-block">
                {`
import { useEmailVerification } from "../utils/auth-hooks.ts";

function EmailVerificationPage() {
  const {
    verifyEmail,        // (token: string) => Promise<boolean>
    isVerifying,        // Signal<boolean>
    verifyError,        // Signal<string | null>
    verifySuccess       // Signal<boolean>
  } = useEmailVerification();

  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);
}`}
              </pre>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Live Demo</h2>
          <p>
            This example shows the <code>useAuthFunctions</code> hook in action:
          </p>

          <div className="demo-container">
            <AuthProvider initialUser={user}>
              <AuthStateDemo />
            </AuthProvider>
          </div>
        </section>

        <section className="content-section">
          <h2>Benefits of Custom Auth Hooks</h2>

          <ul className="benefits-list">
            <li>
              <strong>Separation of Concerns</strong>{" "}
              - Each hook handles a specific authentication function
            </li>
            <li>
              <strong>Reusability</strong>{" "}
              - Use the same hooks across multiple components
            </li>
            <li>
              <strong>State Management</strong>{" "}
              - Each hook manages its own loading and error states
            </li>
            <li>
              <strong>Simplified Components</strong>{" "}
              - Components are cleaner with auth logic abstracted away
            </li>
            <li>
              <strong>Consistent UX</strong>{" "}
              - Standardized handling of loading states and errors
            </li>
            <li>
              <strong>Reactivity</strong>{" "}
              - Preact Signals provide reactive state updates
            </li>
          </ul>
        </section>

        <section className="content-section">
          <h2>Implementation Details</h2>

          <p>
            These hooks are built on top of the AuthContext Provider and use
            Preact Signals for state management.
          </p>

          <p>Key features:</p>
          <ul>
            <li>
              All state is managed via Preact Signals for reactive updates
            </li>
            <li>Error handling is built into each hook</li>
            <li>Loading states are tracked for better UX</li>
            <li>The hooks compose well together</li>
            <li>They provide a consistent API for authentication operations</li>
          </ul>

          <p>View the source code:</p>
          <ul>
            <li>
              <a href="https://github.com/your-repo/path-to-file/utils/auth-hooks.ts">
                auth-hooks.ts
              </a>
            </li>
            <li>
              <a href="https://github.com/your-repo/path-to-file/utils/auth-context.tsx">
                auth-context.tsx
              </a>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
