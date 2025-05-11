import type { Handlers, PageProps } from '$fresh/server.ts';
import type { FreshSessionProvider } from 'workos/common/iron-session/fresh-session-provider.ts';
import { type createUserSession, initUserManagement, type SESSION_OPTIONS } from '../utils/user-management.ts';
import RegisterForm from '../islands/RegisterForm.tsx';

interface FormData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
  success?: boolean;
}

export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render({});
  },

  async POST(req, ctx) {
    try {
      // Parse form data
      const form = await req.formData();
      const email = form.get('email')?.toString() || '';
      const password = form.get('password')?.toString() || '';
      const firstName = form.get('firstName')?.toString() || '';
      const lastName = form.get('lastName')?.toString() || '';

      if (!email || !password) {
        return ctx.render({
          email,
          firstName,
          lastName,
          error: 'Email and password are required',
        });
      }

      // Initialize WorkOS User Management
      const { userManagement } = initUserManagement();

      // Create a new user
      const user = await userManagement.createUser({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        emailVerified: false,
      });

      // If we get here, user was created successfully
      return ctx.render({
        email,
        firstName,
        lastName,
        success: true,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return ctx.render({
        error: error instanceof Error ? error.message : 'Failed to create user',
      });
    }
  },
};

export default function Register({ data }: PageProps<FormData>) {
  const { error, success, email, firstName, lastName } = data;

  return (
    <div class='container'>
      <h1>Create an Account</h1>

      <RegisterForm
        error={error}
        success={success}
        initialValues={{
          email,
          firstName,
          lastName,
        }}
      />
    </div>
  );
}
