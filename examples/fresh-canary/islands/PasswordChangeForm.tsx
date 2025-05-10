import { useState } from "preact/hooks";
import { WorkOSUser } from "../utils/user-management.ts";

interface PasswordChangeFormProps {
  user: WorkOSUser;
}

export default function PasswordChangeForm({ user }: PasswordChangeFormProps) {
  // State for form fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State for form submission and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Client-side validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get error message based on error code
  const getErrorMessage = (errorCode: string) => {
    switch(errorCode) {
      case "missing_fields": return "All fields are required";
      case "passwords_dont_match": return "New passwords don't match";
      case "invalid_password": return "Current password is incorrect";
      case "update_failed": return "Failed to update password";
      default: return "An error occurred";
    }
  };

  // Validate the form
  const validateForm = () => {
    // Reset validation error
    setValidationError(null);
    
    // Check for empty fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError("All fields are required");
      return false;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setValidationError("New passwords don't match");
      return false;
    }
    
    // Check minimum password length
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Reset messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("action", "change_password");
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);
      
      // Submit form data
      const response = await fetch("/account", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setSuccessMessage("Password updated successfully");
        // Reset form fields after successful submission
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Extract error code from redirect URL if available
        const redirectUrl = response.headers.get("Location");
        if (redirectUrl) {
          const url = new URL(redirectUrl, window.location.origin);
          const error = url.searchParams.get("error");
          if (error) {
            setErrorMessage(getErrorMessage(error));
          } else {
            setErrorMessage("Failed to update password");
          }
        } else {
          setErrorMessage("Failed to update password");
        }
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage("An error occurred while updating password");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel button click - returns to main account view
  const handleCancel = (e: Event) => {
    e.preventDefault();
    window.location.href = "/account";
  };
  
  return (
    <div class="password-change-section">
      <h2>Change Password</h2>
      
      {successMessage && (
        <div class="success-message">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div class="error-message">
          {errorMessage}
        </div>
      )}
      
      {validationError && (
        <div class="error-message">
          {validationError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input 
            type="password" 
            id="currentPassword" 
            name="currentPassword" 
            value={currentPassword} 
            onInput={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input 
            type="password" 
            id="newPassword" 
            name="newPassword" 
            value={newPassword} 
            onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
            required 
            minLength={8}
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            value={confirmPassword} 
            onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            required 
            minLength={8}
          />
        </div>
        
        <div class="actions">
          <button 
            type="submit" 
            class="button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Change Password"}
          </button>
          <button 
            onClick={handleCancel}
            class="button secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}