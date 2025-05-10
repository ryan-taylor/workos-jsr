import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import {
  requireAuth,
  getCurrentUser,
  WorkOSUser,
  initUserManagement
} from "../../utils/user-management.ts";
import UserProfileWithSignals from "../../islands/UserProfileWithSignals.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }
    
    // Get current user from session
    const user = await getCurrentUser(req);
    
    // Initialize user management to access user data
    const { userManagement } = initUserManagement();
    
    // Get user profile details (could include additional data)
    const userProfile = user ? await userManagement.getUser(user.id) : null;
    
    // Render the page with user data
    return ctx.render({
      user,
      userProfile
    });
  },
};

export default function SignalsPage({ data }: PageProps<{
  user: WorkOSUser;
  userProfile?: any;
}>) {
  const { user, userProfile } = data;
  
  return (
    <div class="container">
      <h1>Preact Signals Example</h1>
      <p>This page demonstrates the use of Preact Signals for state management.</p>
      
      <div class="comparison-info">
        <h2>Benefits of Using Signals</h2>
        <ul>
          <li><strong>Fine-grained reactivity:</strong> Only components using a specific signal re-render when it changes</li>
          <li><strong>Improved performance:</strong> Fewer re-renders means better performance in complex UIs</li>
          <li><strong>Simpler code:</strong> Less boilerplate than useState, useCallback, and useMemo</li>
          <li><strong>Automatic dependency tracking:</strong> No need to specify dependencies manually</li>
          <li><strong>Easier debugging:</strong> Signals provide a clear data flow through your application</li>
        </ul>
      </div>
      
      {/* Using the Signal-based component */}
      <UserProfileWithSignals user={user} userProfile={userProfile} />
      
      <div class="actions">
        <a href="/protected" class="button">View Regular useState Version</a>
        <a href="/" class="button">Home</a>
      </div>
    </div>
  );
}