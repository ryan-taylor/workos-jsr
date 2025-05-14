import type { Handlers, PageProps } from "$fresh/server.ts";
import {
  getCurrentUser,
  initUserManagement,
  requireAuth,
} from "../utils/user-management.ts";

interface VerifyEmailData {
  success?: boolean;
  error?: string;
  code?: string;
  sent?: boolean;
  userId?: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if this is a verification code callback
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("userId");

    // If we have a code and userId in the URL, process verification
    if (code && userId) {
      try {
        // Initialize WorkOS User Management
        const { userManagement } = initUserManagement();

        // Verify the email
        await userManagement.verifyEmail({
          code,
          userId,
        });

        // Return success
        return ctx.render({ success: true });
      } catch (error) {
        console.error("Email verification error:", error);
        return ctx.render({
          error:
            "Failed to verify email. The verification code may be invalid or expired.",
        });
      }
    }

    // Otherwise, require auth to send verification email
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    // Render the form
    return ctx.render({ userId: user.id });
  },

  async POST(req, ctx) {
    // Require auth to send verification email
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    try {
      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();

      // Send verification email
      await userManagement.sendVerificationEmail({
        userId: user.id,
      });

      // Render success
      return ctx.render({
        userId: user.id,
        sent: true,
      });
    } catch (error) {
      console.error("Send verification email error:", error);
      return ctx.render({
        userId: user.id,
        error: "Failed to send verification email. Please try again later.",
      });
    }
  },
};

export default function VerifyEmail({ data }: PageProps<VerifyEmailData>) {
  const { success, error, sent, userId } = data;

  if (success) {
    return (
      <div class="container">
        <h1>Email Verified</h1>
        <div class="success-message">
          <p>Your email has been successfully verified.</p>
          <div class="actions">
            <a href="/account" class="button">Go to Your Account</a>
            <a href="/protected" class="button secondary">Go to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="container">
      <h1>Verify Your Email</h1>

      {error && <div class="error-message">{error}</div>}

      {sent
        ? (
          <div class="success-message">
            <p>A verification email has been sent to your email address.</p>
            <p>
              Please check your inbox and click the verification link to verify
              your email.
            </p>
            <div class="actions">
              <a href="/account" class="button">Return to Account</a>
            </div>
          </div>
        )
        : (
          <>
            <p>
              Verify your email address to ensure you can recover your account
              and receive important notifications.
            </p>

            <form method="post">
              <div class="actions">
                <button type="submit" class="button">
                  Send Verification Email
                </button>
                <a href="/account" class="button secondary">Back to Account</a>
              </div>
            </form>
          </>
        )}
    </div>
  );
}
