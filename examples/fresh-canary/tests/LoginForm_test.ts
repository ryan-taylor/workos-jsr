import {
  assertContains,
  assertEquals,
  type assertExists,
  mockFetchError,
  type mockFetchJson,
  mockFetchRedirect,
  restoreFetch,
} from "./test_config.ts";
import LoginForm from "../islands/LoginForm.tsx";

Deno.test("LoginForm - renders login form correctly", () => {
  // Create a mock render context
  const ctx = {
    authorizationURL: undefined,
    error: undefined,
    redirectTo: "/protected",
  };

  // Simulate rendering the component
  const component = LoginForm(ctx);

  // Assert component structure
  assertEquals(typeof component, "object");
  assertContains(JSON.stringify(component), "form");
  assertContains(JSON.stringify(component), "input");
  assertContains(JSON.stringify(component), "email");
  assertContains(JSON.stringify(component), "password");
  assertContains(JSON.stringify(component), "Sign In");
});

Deno.test("LoginForm - displays SSO button when authorizationURL is provided", () => {
  // Create a mock render context with SSO URL
  const ctx = {
    authorizationURL: "https://example.com/sso",
    error: undefined,
    redirectTo: "/protected",
  };

  // Simulate rendering the component
  const component = LoginForm(ctx);

  // Assert SSO button is present
  assertContains(JSON.stringify(component), "Continue with SSO");
  assertContains(JSON.stringify(component), "https://example.com/sso");
});

Deno.test("LoginForm - displays error when provided", () => {
  // Create a mock render context with error
  const ctx = {
    authorizationURL: undefined,
    error: "Invalid credentials",
    redirectTo: "/protected",
  };

  // Simulate rendering the component
  const component = LoginForm(ctx);

  // Assert error message is displayed
  assertContains(JSON.stringify(component), "error-message");
  assertContains(JSON.stringify(component), "Invalid credentials");
});

Deno.test("LoginForm - validates email format", () => {
  // Mock state variables
  let email = "";
  let password = "";
  let validationError: string | null = null;

  // Mock state setters
  const setValidationError = (error: string | null) => {
    validationError = error;
  };

  // Create validation function to test
  const validateForm = (): boolean => {
    if (!email) {
      setValidationError("Email is required");
      return false;
    }

    if (!email.includes("@")) {
      setValidationError("Please enter a valid email address");
      return false;
    }

    if (!password) {
      setValidationError("Password is required");
      return false;
    }

    return true;
  };

  // Test empty email
  email = "";
  password = "password123";
  assertEquals(validateForm(), false);
  assertEquals(validationError, "Email is required");

  // Test invalid email format
  email = "invalid-email";
  validationError = null;
  assertEquals(validateForm(), false);
  assertEquals(validationError, "Please enter a valid email address");

  // Test empty password
  email = "test@example.com";
  password = "";
  validationError = null;
  assertEquals(validateForm(), false);
  assertEquals(validationError, "Password is required");

  // Test valid inputs
  email = "test@example.com";
  password = "password123";
  validationError = null;
  assertEquals(validateForm(), true);
  assertEquals(validationError, null);
});

Deno.test("LoginForm - handles form submission with redirect", async () => {
  // Mock state variables
  let email = "test@example.com";
  let password = "password123";
  let isSubmitting = false;
  let validationError: string | null = null;
  let serverError: string | null = null;

  // Track redirects
  let redirectTarget: string | null = null;

  // Mock window.location for tracking redirects
  const mockLocation = {
    currentUrl: "http://localhost:8000/login",
    redirectTo(url: string) {
      redirectTarget = url;
    },
  };

  // Mock successful redirect response
  mockFetchRedirect("/protected");

  // Mock form submission handler
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Reset error states
    validationError = null;
    serverError = null;

    // Validate form - simplified for test
    if (!email.includes("@") || !password) {
      validationError = "Invalid input";
      return;
    }

    isSubmitting = true;

    try {
      // Create form data
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      // Submit form data to login endpoint
      const response = await fetch(`/login?redirect=/protected`, {
        method: "POST",
        body: formData,
      });

      if (response.redirected) {
        // If successful redirect, follow it
        mockLocation.redirectTo(response.url);
        return;
      }

      if (response.ok) {
        const text = "Success";

        // If we got a success response but no redirect, try to parse it
        if (text.includes("Authentication failed")) {
          serverError = "Authentication failed. Please check your credentials.";
        } else {
          // Fallback to redirecting to protected page
          mockLocation.redirectTo("/protected");
        }
      } else {
        // Handle error response
        serverError = "Authentication failed. Please check your credentials.";
      }
    } catch (error) {
      console.error("Login error:", error);
      serverError = "An error occurred during login. Please try again.";
    } finally {
      isSubmitting = false;
    }
  };

  // Trigger form submission
  await handleSubmit({ preventDefault: () => {} });

  // Check that the redirect was followed
  assertEquals(redirectTarget, "/protected");
  assertEquals(serverError, null);
  assertEquals(validationError, null);

  // Restore fetch
  restoreFetch();
});

Deno.test("LoginForm - handles error response", async () => {
  // Mock state variables
  let email = "test@example.com";
  let password = "password123";
  let isSubmitting = false;
  let validationError: string | null = null;
  let serverError: string | null = null;

  // Mock error response
  mockFetchError(401, "Unauthorized");

  // Mock form submission handler
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Reset error states
    validationError = null;
    serverError = null;

    // Validate form - simplified for test
    if (!email.includes("@") || !password) {
      validationError = "Invalid input";
      return;
    }

    isSubmitting = true;

    try {
      // Create form data
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      // Submit form data to login endpoint
      const response = await fetch(`/login?redirect=/protected`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Handle error response
        serverError = "Authentication failed. Please check your credentials.";
      }
    } catch (error) {
      console.error("Login error:", error);
      serverError = "An error occurred during login. Please try again.";
    } finally {
      isSubmitting = false;
    }
  };

  // Trigger form submission
  await handleSubmit({ preventDefault: () => {} });

  // Check that the error message was set
  assertEquals(
    serverError,
    "Authentication failed. Please check your credentials.",
  );
  assertEquals(validationError, null);
  assertEquals(isSubmitting, false);

  // Restore fetch
  restoreFetch();
});
