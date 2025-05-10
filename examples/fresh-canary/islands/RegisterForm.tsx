import { useState } from "preact/hooks";

interface RegisterFormProps {
  error?: string;
  success?: boolean;
  initialValues?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function RegisterForm({ error, success, initialValues = {} }: RegisterFormProps) {
  // Form state
  const [email, setEmail] = useState(initialValues.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState(initialValues.firstName || "");
  const [lastName, setLastName] = useState(initialValues.lastName || "");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(error || null);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(success || false);
  
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
    
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
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
      if (firstName) formData.append("firstName", firstName);
      if (lastName) formData.append("lastName", lastName);
      
      // Submit form data to register endpoint
      const response = await fetch("/register", {
        method: "POST",
        body: formData,
      });
      
      if (response.redirected) {
        // If successful redirect, follow it
        window.location.href = response.url;
        return;
      }
      
      // Parse the response to check for result
      const responseText = await response.text();
      
      if (response.ok && responseText.includes("success")) {
        // Registration was successful
        setRegistrationSuccess(true);
      } else {
        // Handle error response
        try {
          // Try to parse the error message from the response
          const errorMatch = responseText.match(/<div class="error-message">(.*?)<\/div>/);
          if (errorMatch && errorMatch[1]) {
            setServerError(errorMatch[1]);
          } else {
            setServerError("Failed to create user. Please try again.");
          }
        } catch (parseError) {
          setServerError("Failed to create user. Please try again.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setServerError("An error occurred during registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (registrationSuccess) {
    return (
      <div class="success-message">
        <p>Account created successfully! Please check your email to verify your account.</p>
        <div class="actions">
          <a href="/login" class="button">Login Now</a>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {(serverError || validationError) && (
        <div class="error-message">
          {serverError || validationError}
        </div>
      )}
      
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
            minLength={8}
          />
        </div>
        
        <div class="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            value={confirmPassword} 
            onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            required 
            minLength={8}
          />
        </div>
        
        <div class="form-group">
          <label htmlFor="firstName">First Name (Optional)</label>
          <input 
            type="text" 
            id="firstName" 
            value={firstName}
            onInput={(e) => setFirstName((e.target as HTMLInputElement).value)}
          />
        </div>
        
        <div class="form-group">
          <label htmlFor="lastName">Last Name (Optional)</label>
          <input 
            type="text" 
            id="lastName" 
            value={lastName}
            onInput={(e) => setLastName((e.target as HTMLInputElement).value)}
          />
        </div>
        
        <div class="actions">
          <button 
            type="submit" 
            class="button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
      
      <div class="alternative-options">
        <p>Already have an account? <a href="/login">Login here</a></p>
        <p>Or <a href="/login">login with SSO</a></p>
      </div>
    </div>
  );
}