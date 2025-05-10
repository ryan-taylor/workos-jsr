import { useState } from "preact/hooks";
import { WorkOSUser } from "../utils/user-management.ts";

interface ProfileFormProps {
  user: WorkOSUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  // State for form fields
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  
  // State for form submission and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    // Reset messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("action", "update_profile");
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      
      // Submit form data
      const response = await fetch("/account", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setSuccessMessage("Profile updated successfully");
      } else {
        setErrorMessage("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div class="user-profile-section">
      <h2>Profile Information</h2>
      
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
      
      <form onSubmit={handleSubmit}>
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            value={user.email} 
            disabled 
          />
          <small>Email cannot be changed</small>
        </div>
        
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={firstName} 
            onInput={(e) => setFirstName((e.target as HTMLInputElement).value)}
          />
        </div>
        
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
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
            {isSubmitting ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}