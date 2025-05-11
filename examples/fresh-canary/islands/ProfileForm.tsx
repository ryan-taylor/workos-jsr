import { useState } from 'preact/hooks';
import type { WorkOSUser } from '../utils/user-management.ts';

/**
 * Props for the ProfileForm component
 */
interface ProfileFormProps {
  user: WorkOSUser;
}

/**
 * Form for updating user profile information
 *
 * @param props - Component props
 * @returns ProfileForm component
 */
export default function ProfileForm({ user }: ProfileFormProps) {
  // State for form fields
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  const [lastName, setLastName] = useState<string>(user.lastName || '');

  // State for form submission and messages
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handle form submission
   * @param e - Form submit event
   */
  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    // Reset messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('action', 'update_profile');
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);

      // Submit form data
      const response = await fetch('/account', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
      } else {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(errorData?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change for text fields
   * @param setter - State setter function
   * @returns Event handler function
   */
  const handleInputChange = (setter: (value: string) => void) => (e: Event): void => {
    const target = e.target as HTMLInputElement;
    setter(target.value);
  };

  return (
    <div class='user-profile-section'>
      <h2>Profile Information</h2>

      {successMessage && (
        <div class='success-message' role="alert">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div class='error-message' role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div class='form-group'>
          <label htmlFor='email'>Email</label>
          <input
            type='email'
            id='email'
            value={user.email}
            disabled
            aria-readonly="true"
          />
          <small>Email cannot be changed</small>
        </div>

        <div class='form-group'>
          <label htmlFor='firstName'>First Name</label>
          <input
            type='text'
            id='firstName'
            name='firstName'
            value={firstName}
            onInput={handleInputChange(setFirstName)}
            aria-required="false"
          />
        </div>

        <div class='form-group'>
          <label htmlFor='lastName'>Last Name</label>
          <input
            type='text'
            id='lastName'
            name='lastName'
            value={lastName}
            onInput={handleInputChange(setLastName)}
            aria-required="false"
          />
        </div>

        <div class='actions'>
          <button
            type='submit'
            class='button'
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
