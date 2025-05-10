# Core Authentication Modules

This document covers the implementation details for the core authentication modules in WorkOS, including SSO, User Management, Passwordless Authentication, and Multi-Factor Authentication (MFA).

## Single Sign-On (SSO)

SSO allows users to authenticate using their existing enterprise identity provider accounts (Okta, Google, Microsoft, etc.).

### API Endpoint Setup

Create an API endpoint to generate SSO authorization URLs:

```typescript
// routes/api/sso/authorize.ts
import { Handler } from "$fresh/server.ts";
import { initUserManagement } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  const { workos } = initUserManagement();
  const url = new URL(req.url);
  const connection = url.searchParams.get("connection") || undefined;
  const organization = url.searchParams.get("organization") || undefined;
  const provider = url.searchParams.get("provider") || undefined;
  const domain = url.searchParams.get("domain") || undefined;
  
  try {
    const authorizationURL = workos.sso.getAuthorizationUrl({
      clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
      redirectUri: `${url.origin}/callback`,
      connection,
      organization,
      provider,
      domain,
      state: crypto.randomUUID(),
    });
    
    return Response.json({ url: authorizationURL });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
};
```

### Callback Route Implementation

Create a callback handler for processing SSO authentication:

```typescript
// routes/callback.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req) {
    const { userManagement } = initUserManagement();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }
    
    try {
      const authResponse = await userManagement.authenticateWithCode({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        code,
        session: {
          sealSession: true,
          cookiePassword: Deno.env.get("SESSION_SECRET") || "",
        }
      });
      
      // Create response and set session cookie
      const headers = new Headers();
      if (authResponse.cookie) {
        headers.set("Set-Cookie", authResponse.cookie);
      }
      
      headers.set("Location", "/dashboard");
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      return new Response(`Authentication error: ${error.message}`, { 
        status: 400 
      });
    }
  }
};

export default function Callback() {
  return <div>Processing authentication...</div>;
}
```

### SSO Login UI Component

Create an Island component for SSO login:

```typescript
// islands/SSOLogin.tsx
import { useState } from "preact/hooks";

export default function SSOLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSSOLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/sso/authorize?connection=conn_123`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Failed to initialize SSO login");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleSSOLogin} 
        disabled={loading}
        class="btn btn-primary w-full"
      >
        {loading ? "Loading..." : "Continue with SSO"}
      </button>
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

## User Management

User Management provides complete authentication capabilities including registration, password-based login, and account management.

### API Endpoint Setup

Create an API endpoint for user authentication:

```typescript
// routes/api/auth/login.ts
import { Handler } from "$fresh/server.ts";
import { initUserManagement } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  try {
    const { userManagement } = initUserManagement();
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" }, 
        { status: 400 }
      );
    }
    
    const authResponse = await userManagement.authenticateWithPassword({
      clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
      email,
      password,
      session: {
        sealSession: true,
        cookiePassword: Deno.env.get("SESSION_SECRET") || "",
      }
    });
    
    // Create response with session cookie
    const headers = new Headers();
    if (authResponse.cookie) {
      headers.set("Set-Cookie", authResponse.cookie);
    }
    
    return Response.json({ success: true, user: authResponse.user }, { headers });
  } catch (error) {
    return Response.json(
      { error: error.message || "Authentication failed" }, 
      { status: 401 }
    );
  }
};
```

### Registration Route Implementation

Create a registration handler:

```typescript
// routes/register.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";
import RegisterForm from "../islands/RegisterForm.tsx";

export const handler: Handlers = {
  async POST(req) {
    const { userManagement } = initUserManagement();
    const formData = await req.formData();
    
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    
    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }
    
    try {
      const user = await userManagement.createUser({
        email,
        password,
        firstName,
        lastName,
      });
      
      // Authenticate the user after registration
      const authResponse = await userManagement.authenticateWithPassword({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        email,
        password,
        session: {
          sealSession: true,
          cookiePassword: Deno.env.get("SESSION_SECRET") || "",
        }
      });
      
      // Create response and set session cookie
      const headers = new Headers();
      if (authResponse.cookie) {
        headers.set("Set-Cookie", authResponse.cookie);
      }
      
      headers.set("Location", "/dashboard");
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      return new Response(`Registration error: ${error.message}`, { 
        status: 400 
      });
    }
  },
  
  GET(req, ctx) {
    return ctx.render();
  }
};

export default function Register(props: PageProps) {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Create an Account</h1>
      <RegisterForm />
    </div>
  );
}
```

### Registration UI Component

```typescript
// islands/RegisterForm.tsx
import { useState } from "preact/hooks";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const response = await fetch("/register", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      // Registration successful, redirect will be handled by the server
    } catch (err) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} class="max-w-md mx-auto">
      <div class="mb-4">
        <label class="block mb-2" for="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <div class="mb-4">
        <label class="block mb-2" for="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <div class="mb-4">
        <label class="block mb-2" for="firstName">First Name</label>
        <input
          id="firstName"
          type="text"
          name="firstName"
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <div class="mb-4">
        <label class="block mb-2" for="lastName">Last Name</label>
        <input
          id="lastName"
          type="text"
          name="lastName"
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 bg-blue-500 text-white rounded"
      >
        {loading ? "Creating Account..." : "Sign Up"}
      </button>
      
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
```

## Passwordless Authentication

Passwordless authentication allows users to sign in with one-time codes sent to their email.

### API Endpoint Setup

Create an API endpoint for initiating passwordless authentication:

```typescript
// routes/api/auth/passwordless.ts
import { Handler } from "$fresh/server.ts";
import { initUserManagement } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  try {
    const { workos } = initUserManagement();
    const { email, redirectUri } = await req.json();
    
    if (!email) {
      return Response.json(
        { error: "Email is required" }, 
        { status: 400 }
      );
    }
    
    const session = await workos.passwordless.createSession({
      email,
      type: "MagicLink",
      redirectUri: redirectUri || `${new URL(req.url).origin}/verify-passwordless`,
    });
    
    await workos.passwordless.sendSession(session.id);
    
    return Response.json({ 
      success: true, 
      message: "Passwordless authentication link sent" 
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to send passwordless link" }, 
      { status: 400 }
    );
  }
};
```

### Verification Route Implementation

Create a verification route for passwordless authentication:

```typescript
// routes/verify-passwordless.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req) {
    const { workos, userManagement } = initUserManagement();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return new Response("Missing verification code", { status: 400 });
    }
    
    try {
      // Verify the passwordless session
      const { user } = await workos.passwordless.authenticateSession(code);
      
      // Create a user session
      const authResponse = await userManagement.authenticateWithUser({
        clientId: Deno.env.get("WORKOS_CLIENT_ID") || "",
        user,
        session: {
          sealSession: true,
          cookiePassword: Deno.env.get("SESSION_SECRET") || "",
        }
      });
      
      // Create response and set session cookie
      const headers = new Headers();
      if (authResponse.cookie) {
        headers.set("Set-Cookie", authResponse.cookie);
      }
      
      headers.set("Location", "/dashboard");
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      return new Response(`Verification error: ${error.message}`, { 
        status: 400 
      });
    }
  }
};

export default function VerifyPasswordless() {
  return <div>Verifying your login...</div>;
}
```

### Passwordless UI Component

```typescript
// islands/PasswordlessLogin.tsx
import { useState } from "preact/hooks";

export default function PasswordlessLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await fetch("/api/auth/passwordless", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          redirectUri: window.location.origin + "/verify-passwordless"
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send login link");
      }
      
      setMessage("Check your email for a login link");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} class="max-w-md mx-auto">
      <div class="mb-4">
        <label class="block mb-2" for="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 bg-blue-500 text-white rounded"
      >
        {loading ? "Sending..." : "Send Login Link"}
      </button>
      
      {message && <p class="text-green-500 mt-2">{message}</p>}
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
```

## Multi-Factor Authentication (MFA)

MFA adds an additional layer of security by requiring a second verification factor.

### API Endpoint Setup

Create an API endpoint for enrolling MFA factors:

```typescript
// routes/api/mfa/enroll.ts
import { Handler } from "$fresh/server.ts";
import { initUserManagement } from "../../../utils/user-management.ts";
import { getCurrentUser } from "../../../utils/user-management.ts";

export const handler: Handler = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  try {
    const { workos } = initUserManagement();
    const user = await getCurrentUser(req);
    
    if (!user) {
      return Response.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }
    
    const { type } = await req.json();
    
    if (!type || !["totp", "sms"].includes(type)) {
      return Response.json(
        { error: "Valid factor type (totp or sms) is required" }, 
        { status: 400 }
      );
    }
    
    let factor;
    
    if (type === "totp") {
      factor = await workos.mfa.enrollFactor({
        type: "totp",
        userId: user.id,
      });
    } else if (type === "sms") {
      const { phone } = await req.json();
      if (!phone) {
        return Response.json(
          { error: "Phone number is required for SMS factor" }, 
          { status: 400 }
        );
      }
      
      factor = await workos.mfa.enrollFactor({
        type: "sms",
        userId: user.id,
        phoneNumber: phone,
      });
    }
    
    return Response.json({ success: true, factor });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to enroll MFA factor" }, 
      { status: 400 }
    );
  }
};
```

### Verification Route Implementation

Create a verification route for MFA:

```typescript
// routes/verify-mfa.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { initUserManagement } from "../utils/user-management.ts";
import VerifyMFAForm from "../islands/VerifyMFAForm.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const authenticationId = url.searchParams.get("authentication_id");
    
    if (!authenticationId) {
      return new Response("Missing authentication ID", { status: 400 });
    }
    
    return ctx.render({ authenticationId });
  },
  
  async POST(req) {
    const { workos } = initUserManagement();
    const formData = await req.formData();
    
    const authenticationId = formData.get("authenticationId")?.toString();
    const code = formData.get("code")?.toString();
    
    if (!authenticationId || !code) {
      return new Response("Authentication ID and code are required", { status: 400 });
    }
    
    try {
      const authentication = await workos.mfa.verifyAuthentication({
        authenticationId,
        code,
      });
      
      if (authentication.valid) {
        // Redirect to the intended destination
        const headers = new Headers();
        headers.set("Location", "/dashboard");
        return new Response(null, {
          status: 302,
          headers,
        });
      } else {
        return new Response("Invalid verification code", { status: 400 });
      }
    } catch (error) {
      return new Response(`Verification error: ${error.message}`, { 
        status: 400 
      });
    }
  }
};

export default function VerifyMFA(props: PageProps) {
  const { authenticationId } = props.data;
  
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Verify Two-Factor Authentication</h1>
      <VerifyMFAForm authenticationId={authenticationId} />
    </div>
  );
}
```

### MFA UI Component

```typescript
// islands/VerifyMFAForm.tsx
import { useState } from "preact/hooks";

interface VerifyMFAFormProps {
  authenticationId: string;
}

export default function VerifyMFAForm({ authenticationId }: VerifyMFAFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("authenticationId", authenticationId);
      formData.append("code", code);
      
      const response = await fetch("/verify-mfa", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      // Verification successful, redirect will be handled by the server
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Verification failed");
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} class="max-w-md mx-auto">
      <input type="hidden" name="authenticationId" value={authenticationId} />
      
      <div class="mb-4">
        <label class="block mb-2" for="code">Verification Code</label>
        <input
          id="code"
          type="text"
          name="code"
          value={code}
          onChange={(e) => setCode((e.target as HTMLInputElement).value)}
          required
          class="w-full px-3 py-2 border rounded"
          placeholder="Enter the code from your authenticator app"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 bg-blue-500 text-white rounded"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
      
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
```

## Configuration Snippets

### User Management Configuration

```typescript
// utils/user-management.ts
import { WorkOS } from "workos";
import { FreshSessionProvider } from "./fresh-session-provider.ts";

// Set up session options
const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") || "",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax",
};

// Initialize WorkOS and User Management
export function initUserManagement() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const userManagement = workos.userManagement;
  const sessionProvider = new FreshSessionProvider(SESSION_OPTIONS);
  
  return { workos, userManagement, sessionProvider };
}

// Get the current user from the session
export async function getCurrentUser(req: Request) {
  const { sessionProvider } = initUserManagement();
  const session = await sessionProvider.getSession(req);
  
  return session?.user || null;
}

// Middleware to require authentication
export async function requireAuth(req: Request) {
  const user = await getCurrentUser(req);
  
  if (!user) {
    const url = new URL(req.url);
    const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  }
  
  return null;
}

// Create a user session after authentication
export async function createUserSession(
  authData: { user: any; accessToken: string; refreshToken: string },
  redirectPath: string
) {
  const { sessionProvider } = initUserManagement();
  
  const session = {
    user: authData.user,
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  };
  
  const cookie = await sessionProvider.createSession(session);
  
  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookie,
      Location: redirectPath,
    },
  });
}
```

### MFA Configuration

```typescript
// utils/mfa.ts
import { WorkOS } from "workos";

// Initialize WorkOS and MFA
export function initMFA() {
  const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY") || "");
  const mfa = workos.mfa;
  
  return { workos, mfa };
}

// Start MFA authentication
export async function startMFAAuthentication(userId: string, factorId: string) {
  const { mfa } = initMFA();
  
  const authentication = await mfa.startAuthentication({
    userId,
    factorId,
  });
  
  return authentication;
}

// List MFA factors for a user
export async function listMFAFactors(userId: string) {
  const { mfa } = initMFA();
  
  const { data: factors } = await mfa.listFactors({
    userId,
  });
  
  return factors;
}
```

## Screenshot Placeholder Instructions

### SSO Login Flow

```
[SCREENSHOT: SSO Login Button]
Place a screenshot here showing the SSO login button on the login page.
The screenshot should display the "Continue with SSO" button that initiates the SSO flow.
```

```
[SCREENSHOT: SSO Provider Selection]
Place a screenshot here showing the SSO provider selection screen.
The screenshot should display the list of available identity providers for the user to choose from.
```

### User Registration

```
[SCREENSHOT: Registration Form]
Place a screenshot here showing the complete registration form.
The screenshot should display all form fields including email, password, first name, and last name.
```

### MFA Setup

```
[SCREENSHOT: MFA Enrollment]
Place a screenshot here showing the MFA enrollment options.
The screenshot should display the options for setting up TOTP or SMS authentication.
```

```
[SCREENSHOT: MFA QR Code]
Place a screenshot here showing the TOTP QR code for scanning.
The screenshot should display the QR code that users scan with their authenticator app.
```

### Passwordless Authentication

```
[SCREENSHOT: Passwordless Email Entry]
Place a screenshot here showing the passwordless login form.
The screenshot should display the email input field and "Send Login Link" button.
```

```
[SCREENSHOT: Passwordless Success Message]
Place a screenshot here showing the success message after sending the login link.
The screenshot should display the "Check your email for a login link" message.