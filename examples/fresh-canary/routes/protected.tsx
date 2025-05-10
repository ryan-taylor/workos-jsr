import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import {
  requireAuth,
  getCurrentUser,
  WorkOSUser,
  initUserManagement
} from "../utils/user-management.ts";
import UserProfileWithTelemetry from "../islands/UserProfileWithTelemetry.tsx";

// Add performance tracking to page load
import { measureExecutionTime } from "../utils/telemetry.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    return await measureExecutionTime('protected_page_load', async () => {
      // Check if user is authenticated
      const redirectResponse = await requireAuth(req);
      if (redirectResponse) {
        return redirectResponse;
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      // Initialize user management to access user data
      const { userManagement } = initUserManagement();
      
      // Get user profile details with performance tracking
      let userProfile = null;
      if (user) {
        userProfile = await measureExecutionTime(
          'user_profile_fetch',
          () => userManagement.getUser(user.id),
          { userId: user.id }
        );
      }
      
      // Render the page with user data
      return ctx.render({
        user,
        userProfile
      });
    }, {
      path: new URL(req.url).pathname,
      method: req.method
    });
  },
};

export default function ProtectedPage({ data }: PageProps<{
  user: WorkOSUser;
  userProfile?: any;
}>) {
  const { user, userProfile } = data;
  
  return (
    <div class="container">
      <h1>Protected Page</h1>
      <p>You are logged in and can view this protected content.</p>
      
      {/* Island component for user profile with telemetry and refresh capability */}
      <UserProfileWithTelemetry user={user} userProfile={userProfile} />
      
      <div class="actions">
        <a href="/account" class="button">Manage Account</a>
        <a href="/logout" class="button">Logout</a>
      </div>
    </div>
  );
}