import type { Handlers, PageProps } from '$fresh/server.ts';
import { getCurrentUser, initUserManagement, requireAuth, type WorkOSUser } from '../utils/user-management.ts';
import ProfileForm from '../islands/ProfileForm.tsx';
import PasswordChangeForm from '../islands/PasswordChangeForm.tsx';
import AuthFactorsList from '../islands/AuthFactorsList.tsx';

interface AccountData {
  user: WorkOSUser;
  userProfile?: any;
  authFactors?: any[];
  success?: string;
  error?: string;
  showPasswordForm?: boolean;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    // Get current user from session
    const user = await getCurrentUser(req);
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login' },
      });
    }

    // Initialize user management
    const { userManagement } = initUserManagement();

    // Get full user profile
    const userProfile = await userManagement.getUser(user.id);

    // Get authentication factors if available
    let authFactors = [];
    try {
      const factorsResult = await userManagement.listAuthFactors({ userId: user.id });
      authFactors = factorsResult.data || [];
    } catch (error) {
      console.error('Error fetching auth factors:', error);
    }

    // Get URL parameters
    const url = new URL(req.url);
    const showPasswordForm = url.searchParams.get('changePassword') === 'true';
    const success = url.searchParams.get('success') || undefined;
    const error = url.searchParams.get('error') || undefined;

    return ctx.render({
      user,
      userProfile,
      authFactors,
      showPasswordForm,
      success,
      error,
    });
  },

  async POST(req, ctx) {
    try {
      // Check if user is authenticated
      const redirectResponse = await requireAuth(req);
      if (redirectResponse) {
        return redirectResponse;
      }

      // Get current user
      const user = await getCurrentUser(req);
      if (!user) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/login' },
        });
      }

      // Parse form data
      const form = await req.formData();
      const action = form.get('action')?.toString();

      // Initialize user management
      const { userManagement } = initUserManagement();

      // Handle different form actions
      if (action === 'update_profile') {
        const firstName = form.get('firstName')?.toString() || undefined;
        const lastName = form.get('lastName')?.toString() || undefined;

        await userManagement.updateUser({
          userId: user.id,
          firstName,
          lastName,
        });

        return new Response(null, {
          status: 302,
          headers: { Location: '/account?success=profile_updated' },
        });
      } else if (action === 'change_password') {
        const currentPassword = form.get('currentPassword')?.toString();
        const newPassword = form.get('newPassword')?.toString();
        const confirmPassword = form.get('confirmPassword')?.toString();

        if (!currentPassword || !newPassword || !confirmPassword) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/account?changePassword=true&error=missing_fields' },
          });
        }

        if (newPassword !== confirmPassword) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/account?changePassword=true&error=passwords_dont_match' },
          });
        }

        // Authenticate with current password first
        try {
          await userManagement.authenticateWithPassword({
            clientId: Deno.env.get('WORKOS_CLIENT_ID') || '',
            email: user.email,
            password: currentPassword,
          });

          // Then update the password
          await userManagement.updateUser({
            userId: user.id,
            password: newPassword,
          });

          return new Response(null, {
            status: 302,
            headers: { Location: '/account?success=password_updated' },
          });
        } catch (error) {
          console.error('Password change error:', error);
          return new Response(null, {
            status: 302,
            headers: { Location: '/account?changePassword=true&error=invalid_password' },
          });
        }
      }

      // Default fallback
      return new Response(null, {
        status: 302,
        headers: { Location: '/account?error=invalid_action' },
      });
    } catch (error) {
      console.error('Account update error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: '/account?error=update_failed' },
      });
    }
  },
};

export default function AccountPage({ data }: PageProps<AccountData>) {
  const {
    user,
    userProfile,
    authFactors = [],
    showPasswordForm = false,
    success,
    error,
  } = data;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'missing_fields':
        return 'All fields are required';
      case 'passwords_dont_match':
        return "New passwords don't match";
      case 'invalid_password':
        return 'Current password is incorrect';
      case 'update_failed':
        return 'Failed to update account information';
      default:
        return 'An error occurred';
    }
  };

  const getSuccessMessage = (successCode: string) => {
    switch (successCode) {
      case 'profile_updated':
        return 'Profile updated successfully';
      case 'password_updated':
        return 'Password updated successfully';
      default:
        return 'Operation completed successfully';
    }
  };

  return (
    <div class='container'>
      <h1>Account Management</h1>

      {success && (
        <div class='success-message'>
          {getSuccessMessage(success)}
        </div>
      )}

      {error && (
        <div class='error-message'>
          {getErrorMessage(error)}
        </div>
      )}

      <div class='account-sections'>
        <section>
          <ProfileForm user={user} />
        </section>

        <section class='account-security-section'>
          <h2>Account Security</h2>

          {showPasswordForm ? <PasswordChangeForm user={user} /> : (
            <div class='actions'>
              <a href='/account?changePassword=true' class='button'>
                Change Password
              </a>
            </div>
          )}

          <AuthFactorsList initialFactors={authFactors} user={user} />
        </section>

        <section class='account-info-section'>
          <h2>Account Information</h2>
          <div class='account-details'>
            {userProfile && (
              <div>
                <p>
                  <strong>Email Verified:</strong> {userProfile.emailVerified ? 'Yes' : 'No'}
                </p>
                {!userProfile.emailVerified && (
                  <p>
                    <a href='/verify-email' class='button secondary'>
                      Verify Email
                    </a>
                  </p>
                )}

                {userProfile.createdAt && (
                  <p>
                    <strong>Account Created:</strong> {new Date(userProfile.createdAt).toLocaleString()}
                  </p>
                )}

                {userProfile.updatedAt && (
                  <p>
                    <strong>Last Updated:</strong> {new Date(userProfile.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <div class='navigation'>
        <a href='/protected' class='button secondary'>Back to Dashboard</a>
        <a href='/logout' class='button danger'>Logout</a>
      </div>
    </div>
  );
}
