import { useState } from 'preact/hooks';
import type { WorkOSUser } from '../utils/user-management.ts';

/**
 * Props for the PasswordChangeForm component
 */
interface PasswordChangeFormProps {
  user: WorkOSUser;
}

/**
 * Error codes that can be returned from the password change API
 */
type PasswordErrorCode = 'missing_fields' | 'passwords_dont_match' | 'invalid_password' | 'update_failed';

/**
 * Form for changing user password
 */
export default function PasswordChangeForm({ user }: PasswordChangeFormProps) {
  // State for form fields
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // State for form submission and messages
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side validation
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Get error message based on error code
   * @param errorCode - The error code from the API
   * @returns Human-readable error message
   */
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode as PasswordErrorCode) {
      case 'missing_fields':
        return 'All fields are required';
      case 'passwords_dont_match':
        return "New passwords don't match";
      case 'invalid_password':
        return 'Current password is incorrect';
      case 'update_failed':
        return 'Failed to update password';
      default:
        return 'An error occurred';
    }
  };

  /**
   * Validate the form
   * @returns True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    // Reset validation error
    setValidationError(null);

    // Check for empty fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError('All fields are required');
      return false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setValidationError("New passwords don't match");
      return false;
    }

    // Check minimum password length
    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return false;
    }

    return true;
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

  /**
   * Handle form submission
   * @param e - Form submit event
   */
  const handleSubmit = async (e: Event): Promise<void> => {
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
      formData.append('action', 'change_password');
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      formData.append('confirmPassword', confirmPassword);

      // Submit form data
      const response = await fetch('/account', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Password updated successfully');
        // Reset form fields after successful submission
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Extract error code from redirect URL if available
        const redirectUrl = response.headers.get('Location');
        if (redirectUrl) {
          const url = new URL(redirectUrl, globalThis.location.origin);
          const error = url.searchParams.get('error');
          if (error) {
            setErrorMessage(getErrorMessage(error));
          } else {
            setErrorMessage('Failed to update password');
          }
        } else {
          setErrorMessage('Failed to update password');
        }
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setErrorMessage('An error occurred while updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel button click - returns to main account view
   * @param e - Click event
   */
  const handleCancel = (e: Event): void => {
    e.preventDefault();
    globalThis.location.href = '/account';
  };

  return (
    <div class='password-change-section'>
      <h2>Change Password</h2>

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

      {validationError && (
        <div class='error-message' role="alert">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div class='form-group'>
          <label htmlFor='currentPassword'>Current Password</label>
          <input
            type='password'
            id='currentPassword'
            name='currentPassword'
            value={currentPassword}
            onInput={handleInputChange(setCurrentPassword)}
            required
            aria-required="true"
          />
        </div>

        <div class='form-group'>
          <label htmlFor='newPassword'>New Password</label>
          <input
            type='password'
            id='newPassword'
            name='newPassword'
            value={newPassword}
            onInput={handleInputChange(setNewPassword)}
            required
            minLength={8}
            aria-required="true"
          />
        </div>

        <div class='form-group'>
          <label htmlFor='confirmPassword'>Confirm New Password</label>
          <input
            type='password'
            id='confirmPassword'
            name='confirmPassword'
            value={confirmPassword}
            onInput={handleInputChange(setConfirmPassword)}
            required
            minLength={8}
            aria-required="true"
          />
        </div>

        <div class='actions'>
          <button
            type='submit'
            class='button'
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Change Password'}
          </button>
          <button
            onClick={handleCancel}
            class='button secondary'
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
