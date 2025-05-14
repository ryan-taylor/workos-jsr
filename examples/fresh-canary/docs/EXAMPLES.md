# WorkOS + Fresh: Code Examples

This document provides practical code examples for common patterns in Fresh
applications using WorkOS, focusing on form handling, authentication, state
management, and custom hooks.

## Form Handling with Islands

### Basic Login Form

```tsx
// islands/LoginForm.tsx
import { useState } from "preact/hooks";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      // Redirect to protected page on success
      window.location.href = "/protected";
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="login-form">
      <h2>Sign In</h2>

      {error && <div class="error-message">{error}</div>}

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <div class="form-links">
        <a href="/forgot-password">Forgot password?</a>
        <a href="/register">Create account</a>
      </div>
    </form>
  );
}
```

### Form with Validation

```tsx
// islands/RegisterForm.tsx
import { useState } from "preact/hooks";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      // Redirect to success page
      window.location.href = "/registration-success";
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({
        ...errors,
        form: err instanceof Error ? err.message : "Registration failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="register-form">
      <h2>Create Account</h2>

      {errors.form && <div class="error-message">{errors.form}</div>}

      <div class="form-row">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onInput={handleChange}
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onInput={handleChange}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onInput={handleChange}
          required
        />
        {errors.email && <span class="field-error">{errors.email}</span>}
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onInput={handleChange}
          required
        />
        {errors.password && <span class="field-error">{errors.password}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>

      <p class="login-link">
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </form>
  );
}
```

## Authentication with Islands

### SSO Login Button

```tsx
// routes/login.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import LoginForm from "../islands/LoginForm.tsx";
import { WorkOS } from "@workos/sdk";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Initialize WorkOS
    const workos = new WorkOS(
      Deno.env.get("WORKOS_API_KEY") || "",
      { clientId: Deno.env.get("WORKOS_CLIENT_ID") },
    );

    // Get the current URL to create the callback URL
    const url = new URL(req.url);
    const callbackUrl = `${url.origin}/callback`;

    // Generate the authorization URL
    const authorizationUrl = workos.sso.getAuthorizationURL({
      clientID: Deno.env.get("WORKOS_CLIENT_ID") || "",
      redirectURI: callbackUrl,
      state: crypto.randomUUID(), // For CSRF protection
    });

    return ctx.render({ authorizationUrl });
  },
};

export default function LoginPage({ data }: PageProps) {
  const { authorizationUrl } = data;

  return (
    <div class="login-page">
      <h1>Sign In</h1>

      <div class="auth-options">
        <LoginForm />

        <div class="divider">
          <span>OR</span>
        </div>

        <div class="sso-options">
          <a href={authorizationUrl} class="sso-button">
            <img src="/icon-sso.svg" alt="SSO Icon" />
            <span>Sign in with SSO</span>
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Authentication Callback Handler

```tsx
// routes/callback.tsx
import { Handlers } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // Verify the state parameter to prevent CSRF attacks
    // (In a real app, you'd verify this against a stored value)

    if (!code) {
      return new Response("Authorization code is missing", { status: 400 });
    }

    try {
      const { workos, userManagement, sessionProvider } = initUserManagement();

      // Authenticate the user with the received code
      const authResponse = await userManagement.authenticateWithCode({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        code,
      });

      // Create a session
      const sessionData = {
        user: authResponse.user,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      };

      // Get the session object and seal it
      const session = await sessionProvider.getSession(req);
      session.user = sessionData.user;
      session.accessToken = sessionData.accessToken;
      session.refreshToken = sessionData.refreshToken;

      const headers = await sessionProvider.sealSession(session);

      // Redirect to the protected page with the session cookie
      return new Response("", {
        status: 302,
        headers: {
          ...headers,
          Location: "/protected",
        },
      });
    } catch (error) {
      console.error("Authentication error:", error);
      return new Response(`Authentication failed: ${error.message}`, {
        status: 400,
      });
    }
  },
};
```

### Protected Route

```tsx
// routes/protected.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import UserProfile from "../islands/UserProfile.tsx";
import { getCurrentUser, requireAuth } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    // Check if user is authenticated, redirect to login if not
    const redirectResponse = await requireAuth(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    // Get the authenticated user from the session
    const user = await getCurrentUser(req);

    return ctx.render({ user });
  },
};

export default function ProtectedPage({ data }: PageProps) {
  const { user } = data;

  return (
    <div class="protected-page">
      <h1>Protected Area</h1>
      <p>Welcome back! This page is only visible to authenticated users.</p>

      <UserProfile user={user} />

      <div class="actions">
        <a href="/account" class="button">Account Settings</a>
        <a href="/logout" class="button button-secondary">Sign Out</a>
      </div>
    </div>
  );
}
```

## State Management with Signals

Preact Signals provide a lightweight, reactive state management solution.

### Basic Signals Example

```tsx
// islands/UserProfileWithSignals.tsx
import { computed, signal } from "@preact/signals";
import { WorkOSUser } from "../utils/user-management.ts";

interface UserProfileProps {
  user: WorkOSUser;
}

export default function UserProfileWithSignals({ user }: UserProfileProps) {
  // Create signals for reactive state
  const userData = signal(user);
  const isEditing = signal(false);
  const firstName = signal(user.firstName || "");
  const lastName = signal(user.lastName || "");

  // Computed value that depends on other signals
  const fullName = computed(() => {
    return `${firstName.value} ${lastName.value}`.trim() || "No name provided";
  });

  // Toggle edit mode
  const toggleEditMode = () => {
    isEditing.value = !isEditing.value;

    // Reset form values when canceling
    if (!isEditing.value) {
      firstName.value = userData.value.firstName || "";
      lastName.value = userData.value.lastName || "";
    }
  };

  // Save user data
  const saveUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userData.value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.value,
          lastName: lastName.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();

      // Update the user data signal
      userData.value = {
        ...userData.value,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      };

      // Exit edit mode
      isEditing.value = false;
    } catch (error) {
      console.error("Error updating user:", error);
      // Handle error (show error message, etc.)
    }
  };

  return (
    <div class="user-profile">
      <div class="profile-header">
        <h2>{fullName}</h2>
        <button onClick={toggleEditMode}>
          {isEditing.value ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {isEditing.value
        ? (
          <div class="edit-form">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName.value}
                onInput={(
                  e,
                ) => (firstName.value = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName.value}
                onInput={(
                  e,
                ) => (lastName.value = (e.target as HTMLInputElement).value)}
              />
            </div>

            <button onClick={saveUserData} class="save-button">
              Save Changes
            </button>
          </div>
        )
        : (
          <div class="user-info">
            <p>
              <strong>Email:</strong> {userData.value.email}
            </p>
            <p>
              <strong>ID:</strong> {userData.value.id}
            </p>
          </div>
        )}
    </div>
  );
}
```

### Shared State with Signals

```tsx
// signals/auth.ts
import { computed, signal } from "@preact/signals";
import type { WorkOSUser } from "../utils/user-management.ts";

// Create global signals
export const currentUser = signal<WorkOSUser | null>(null);
export const isLoading = signal(false);
export const error = signal<string | null>(null);

// Computed values based on signals
export const isAuthenticated = computed(() => currentUser.value !== null);
export const userName = computed(() => {
  const user = currentUser.value;
  if (!user) return "";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
});

// Actions to update signals
export async function fetchCurrentUser() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch("/api/me");

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await response.json();
    currentUser.value = userData;
  } catch (err) {
    console.error("Error fetching user:", err);
    error.value = err instanceof Error
      ? err.message
      : "An unknown error occurred";
    currentUser.value = null;
  } finally {
    isLoading.value = false;
  }
}

export function logout() {
  currentUser.value = null;
  // Redirect to logout endpoint
  window.location.href = "/logout";
}
```

## Custom Hooks

Custom hooks encapsulate reusable logic for islands.

### Form Hook

```tsx
// hooks/useForm.ts
import { useState } from "preact/hooks";

type ValidationErrors<T> = Partial<Record<keyof T, string>>;
type Validator<T> = (values: T) => ValidationErrors<T>;

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: Validator<T>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setValues({
      ...values,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleBlur = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const { name } = target;

    setTouched({
      ...touched,
      [name]: true,
    });

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);

    setTouched(allTouched);

    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);

      // Don't submit if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
      // You could set a form-wide error here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
  };
}
```

### Authentication Hook

```tsx
// hooks/useAuth.ts
import { useEffect, useState } from "preact/hooks";
import type { WorkOSUser } from "../utils/user-management.ts";

export function useAuth() {
  const [user, setUser] = useState<WorkOSUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated
            setUser(null);
            return;
          }

          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch("/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}
```

### HTTP Request Hook

```tsx
// hooks/useRequest.ts
import { useCallback, useState } from "preact/hooks";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export function useRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(
    url: string,
    options: RequestOptions = {},
  ): Promise<T | null> => {
    const { params, ...fetchOptions } = options;

    // Add query parameters if provided
    let requestUrl = url;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      requestUrl = `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(requestUrl, {
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || `Request failed with status ${response.status}`,
          );
        }

        return data as T;
      } else {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || `Request failed with status ${response.status}`,
          );
        }

        return null;
      }
    } catch (err) {
      console.error("Request error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    request,
    isLoading,
    error,
  };
}
```

## Combining Patterns

### Complete Example: User Management with Signals and Hooks

```tsx
// islands/UserManager.tsx
import { useEffect } from "preact/hooks";
import { computed, signal } from "@preact/signals";
import { useRequest } from "../hooks/useRequest.ts";
import { useForm } from "../hooks/useForm.ts";

// Define signals
const users = signal<any[]>([]);
const selectedUser = signal<any | null>(null);
const isEditMode = signal(false);

// Computed values
const userCount = computed(() => users.value.length);
const hasSelectedUser = computed(() => selectedUser.value !== null);

export default function UserManager() {
  const { request, isLoading, error } = useRequest();

  // Setup form
  const { values, handleChange, handleSubmit, resetForm, setValues } = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    onSubmit: async (formValues) => {
      if (isEditMode.value && selectedUser.value) {
        await updateUser(selectedUser.value.id, formValues);
      } else {
        await createUser(formValues);
      }

      resetForm();
      isEditMode.value = false;
      selectedUser.value = null;
    },
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Watch for selected user changes to update form
  useEffect(() => {
    if (selectedUser.value && isEditMode.value) {
      setValues({
        firstName: selectedUser.value.firstName || "",
        lastName: selectedUser.value.lastName || "",
        email: selectedUser.value.email,
      });
    }
  }, [selectedUser.value, isEditMode.value]);

  async function fetchUsers() {
    const data = await request<any[]>("/api/users");
    if (data) {
      users.value = data;
    }
  }

  async function createUser(userData: any) {
    const newUser = await request<any>("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (newUser) {
      users.value = [...users.value, newUser];
    }
  }

  async function updateUser(userId: string, userData: any) {
    const updatedUser = await request<any>(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    });

    if (updatedUser) {
      users.value = users.value.map((user) =>
        user.id === userId ? updatedUser : user
      );
    }
  }

  async function deleteUser(userId: string) {
    const success = await request<{ success: boolean }>(
      `/api/users/${userId}`,
      {
        method: "DELETE",
      },
    );

    if (success) {
      users.value = users.value.filter((user) => user.id !== userId);
      if (selectedUser.value?.id === userId) {
        selectedUser.value = null;
        isEditMode.value = false;
      }
    }
  }

  function selectUser(user: any) {
    selectedUser.value = user;
    isEditMode.value = true;
  }

  function cancelEdit() {
    selectedUser.value = null;
    isEditMode.value = false;
    resetForm();
  }

  return (
    <div class="user-manager">
      <div class="user-form-container">
        <h2>{isEditMode.value ? "Edit User" : "Add User"}</h2>

        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              value={values.firstName}
              onInput={handleChange}
            />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              value={values.lastName}
              onInput={handleChange}
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onInput={handleChange}
              required
            />
          </div>

          <div class="form-actions">
            <button type="submit" disabled={isLoading}>
              {isEditMode.value ? "Update User" : "Add User"}
            </button>

            {isEditMode.value && (
              <button type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div class="user-list-container">
        <h2>Users ({userCount})</h2>

        {error && <div class="error-message">{error}</div>}

        {isLoading
          ? <div class="loading">Loading users...</div>
          : (
            <table class="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.value.map((user) => (
                  <tr
                    key={user.id}
                    class={selectedUser.value?.id === user.id ? "selected" : ""}
                  >
                    <td>
                      {`${user.firstName || ""} ${user.lastName || ""}`
                        .trim() || "—"}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <button onClick={() => selectUser(user)}>Edit</button>
                      <button onClick={() => deleteUser(user.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {users.value.length === 0 && (
                  <tr>
                    <td colspan="3" class="empty-state">
                      No users found. Add your first user with the form.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
```

## Additional Resources

For more information and advanced patterns, see the following resources:

- [WorkOS Documentation](https://workos.com/docs)
- [Fresh Documentation](https://fresh.deno.dev/docs/introduction)
- [Preact Documentation](https://preactjs.com/guide/v10/getting-started)
- [Preact Signals Documentation](https://preactjs.com/guide/v10/signals)
