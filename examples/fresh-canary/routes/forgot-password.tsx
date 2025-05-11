import type { Handlers, PageProps } from '$fresh/server.ts';
import { initUserManagement } from '../utils/user-management.ts';

interface FormData {
  email?: string;
  error?: string;
  success?: boolean;
}

export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render({});
  },

  async POST(req, ctx) {
    // Parse form data outside try block so it's accessible in catch
    let email: string | undefined;

    try {
      const form = await req.formData();
      email = form.get('email')?.toString();

      if (!email) {
        return ctx.render({ error: 'Email is required' });
      }

      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();

      // Create password reset
      await userManagement.createPasswordReset({
        email,
        redirectUrl: new URL('/reset-password', req.url).toString(),
      });

      // Return success page
      return ctx.render({
        email,
        success: true,
      });
    } catch (error) {
      console.error('Password reset error:', error);

      // We don't want to reveal if the email exists in our system
      // So always show a success message even if the email doesn't exist
      return ctx.render({
        success: true,
        email,
      });
    }
  },
};

export default function ForgotPassword({ data }: PageProps<FormData>) {
  const { email = '', error, success } = data;

  return (
    <div class='container'>
      <h1>Forgot Password</h1>

      {success
        ? (
          <div class='success-message'>
            <p>If an account exists for {email}, we've sent a password reset link to that email address.</p>
            <p>Please check your inbox and follow the instructions to reset your password.</p>
            <div class='actions'>
              <a href='/login' class='button'>Return to Login</a>
            </div>
          </div>
        )
        : (
          <>
            {error && <div class='error-message'>{error}</div>}

            <p>Enter your email address and we'll send you a link to reset your password.</p>

            <form method='post'>
              <div class='form-group'>
                <label for='email'>Email</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={email}
                  required
                />
              </div>

              <div class='actions'>
                <button type='submit' class='button'>Send Reset Link</button>
                <a href='/login' class='button secondary'>Back to Login</a>
              </div>
            </form>
          </>
        )}
    </div>
  );
}
