import type { Handlers, PageProps } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";

interface ResetPasswordData {
  token?: string;
  userId?: string;
  passwordResetId?: string;
  error?: string;
  success?: boolean;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const passwordResetId = url.searchParams.get("id") || "";

    if (!token || !passwordResetId) {
      return ctx.render({
        error: "Invalid password reset link. Please request a new one.",
      });
    }

    try {
      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();

      // Verify the password reset token
      const passwordReset = await userManagement.getPasswordReset(
        passwordResetId,
      );

      if (!passwordReset || passwordReset.token !== token) {
        return ctx.render({
          error:
            "Invalid or expired password reset link. Please request a new one.",
        });
      }

      // If we got here, the token is valid
      return ctx.render({
        token,
        passwordResetId,
        userId: passwordReset.userId,
      });
    } catch (error) {
      console.error("Error validating password reset:", error);
      return ctx.render({
        error:
          "Invalid or expired password reset link. Please request a new one.",
      });
    }
  },

  async POST(req, ctx) {
    try {
      // Parse form data
      const form = await req.formData();
      const token = form.get("token")?.toString() || "";
      const passwordResetId = form.get("passwordResetId")?.toString() || "";
      const userId = form.get("userId")?.toString() || "";
      const password = form.get("password")?.toString() || "";
      const confirmPassword = form.get("confirmPassword")?.toString() || "";

      // Validate input
      if (!token || !passwordResetId || !userId) {
        return ctx.render({
          error: "Invalid password reset request. Please try again.",
        });
      }

      if (!password || !confirmPassword) {
        return ctx.render({
          token,
          passwordResetId,
          userId,
          error: "Please enter and confirm your new password.",
        });
      }

      if (password !== confirmPassword) {
        return ctx.render({
          token,
          passwordResetId,
          userId,
          error: "Passwords do not match. Please try again.",
        });
      }

      if (password.length < 8) {
        return ctx.render({
          token,
          passwordResetId,
          userId,
          error: "Password must be at least 8 characters long.",
        });
      }

      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();

      // Reset the password
      await userManagement.resetPassword({
        token,
        passwordResetId,
        password,
      });

      // Return success
      return ctx.render({ success: true });
    } catch (error) {
      console.error("Password reset error:", error);
      return ctx.render({
        error: error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.",
      });
    }
  },
};

export default function ResetPassword({ data }: PageProps<ResetPasswordData>) {
  const { token, passwordResetId, userId, error, success } = data;

  if (success) {
    return (
      <div class="container">
        <h1>Password Reset Successful</h1>
        <div class="success-message">
          <p>Your password has been successfully reset.</p>
          <div class="actions">
            <a href="/login" class="button">Log In Now</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="container">
      <h1>Reset Your Password</h1>

      {error && <div class="error-message">{error}</div>}

      {token && passwordResetId && userId
        ? (
          <form method="post">
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="passwordResetId"
              value={passwordResetId}
            />
            <input type="hidden" name="userId" value={userId} />

            <div class="form-group">
              <label for="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
              />
              <small>Password must be at least 8 characters long</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
              />
            </div>

            <div class="actions">
              <button type="submit" class="button">Reset Password</button>
            </div>
          </form>
        )
        : (
          <div class="actions">
            <a href="/forgot-password" class="button">
              Request a New Password Reset Link
            </a>
          </div>
        )}
    </div>
  );
}
