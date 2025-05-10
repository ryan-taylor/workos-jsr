import { useState } from "preact/hooks";

interface LoginFormProps {
  authorizationURL?: string;
  error?: string;
  redirectTo?: string;
}

export default function LoginForm({ authorizationURL, error, redirectTo = "/protected" }: LoginFormProps) {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(error || null);
  
  // Validation function
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
  
  // Form submission handler
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Reset error states
    setValidationError(null);
    setServerError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      
      // Submit form data to login endpoint
      const response = await fetch(`/login?redirect=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        body: formData,
      });
      
      if (response.redirected) {
        // If successful redirect, follow it
        window.location.href = response.url;
        return;
      }
      
      if (response.ok) {
        // Parse the response to check for errors
        const text = await response.text();
        
        // If we got a success response but no redirect, try to parse it
        if (text.includes("Authentication failed")) {
          setServerError("Authentication failed. Please check your credentials.");
        } else {
          // Fallback to redirecting to protected page
          window.location.href = redirectTo;
        }
      } else {
        // Handle error response
        setServerError("Authentication failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setServerError("An error occurred during login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div class="container">
      <h1>Sign In</h1>
      
      {(serverError || validationError) && (
        <div class="error-message">
          {serverError || validationError}
        </div>
      )}
      
      <div class="login-methods">
        <div class="password-login">
          <h2>Sign in with Email and Password</h2>
          <form onSubmit={handleSubmit}>
            <div class="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                required 
              />
            </div>
            
            <div class="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                required 
              />
            </div>
            
            <div class="actions">
              <button 
                type="submit" 
                class="button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
          
          <div class="alternative-options">
            <p><a href="/forgot-password">Forgot your password?</a></p>
            <p>Don't have an account? <a href="/register">Register here</a></p>
          </div>
        </div>
        
        {authorizationURL && (
          <div class="sso-login">
            <h2>Or Sign in with SSO</h2>
            <p>
              Use your organization's single sign-on provider.
            </p>
            <div class="actions">
              <a href={authorizationURL} class="button sso-button">
                Continue with SSO
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}