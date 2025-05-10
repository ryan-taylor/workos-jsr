// Route demonstrating the Auth Context functionality
import { Handlers, PageProps } from "$fresh/server.ts";
import { getCurrentUser, WorkOSUser } from "../../utils/user-management.ts";
import { AuthProvider } from "../../utils/auth-context.tsx";
import AuthStateDemo from "../../islands/AuthStateDemo.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Get current user from session if available
    const user = await getCurrentUser(req);
    
    // Pass the user data to the component
    return ctx.render({ user });
  },
};

export default function AuthContextPage({ data }: PageProps<{ user?: WorkOSUser | null }>) {
  const { user } = data;
  
  return (
    <div className="container">
      <h1>Authentication Context Demo</h1>
      <p>
        This page demonstrates how to use Preact Context with Signals for global authentication state management.
        It provides a cleaner alternative to prop drilling for sharing auth state across components.
      </p>
      
      <div className="comparison-info">
        <h2>Benefits of Using Context with Signals</h2>
        <ul>
          <li>
            <strong>Global state management:</strong> Access authentication state from anywhere in your component tree
          </li>
          <li>
            <strong>Fine-grained reactivity:</strong> Only components using the signals will re-render
          </li>
          <li>
            <strong>Reduced prop drilling:</strong> No need to pass auth state through multiple levels of components
          </li>
          <li>
            <strong>Separation of concerns:</strong> Authentication logic is encapsulated in the context
          </li>
          <li>
            <strong>Simplified API:</strong> Custom hooks make it easy to access auth state and functions
          </li>
        </ul>
      </div>
      
      {/* Wrap the demo in the AuthProvider */}
      <div className="auth-demo-container">
        <AuthProvider initialUser={user}>
          <AuthStateDemo />
        </AuthProvider>
      </div>
      
      <div className="implementation-details">
        <h2>Implementation Details</h2>
        <p>
          The auth context is implemented using Preact's <code>createContext</code> API and Preact Signals.
          This provides a reactive state management system that only re-renders components when the specific
          signals they use change.
        </p>
        <p>
          The server initializes the auth state by checking if the user is authenticated, and then passes this
          initial state to the client-side components through the AuthProvider component.
        </p>
      </div>
      
      <div className="actions">
        <a href="/" className="button">Home</a>
        <a href="/examples/signals" className="button">View Signals Example</a>
      </div>
    </div>
  );
}