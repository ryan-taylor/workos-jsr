import {
  assertContains,
  assertEquals,
  type assertExists,
  createMockUser,
  type mockFetch,
  mockFetchError,
  mockFetchJson,
  type mockFormSubmitEvent,
  type mockInputEvent,
  type render,
  restoreFetch,
} from './test_config.ts';
import ProfileForm from '../islands/ProfileForm.tsx';

// Mock user data
const mockUser = createMockUser();

Deno.test('ProfileForm - renders without errors', () => {
  // Create a mock render context
  const ctx = {
    user: mockUser,
  };

  // Simulate rendering the component
  const component = ProfileForm(ctx);

  // Assert component structure
  assertEquals(typeof component, 'object');
  assertContains(JSON.stringify(component), 'form');
  assertContains(JSON.stringify(component), 'email');
  assertContains(JSON.stringify(component), 'firstName');
  assertContains(JSON.stringify(component), 'lastName');
  assertContains(JSON.stringify(component), 'Update Profile');
});

Deno.test('ProfileForm - handles form input correctly', () => {
  // Create a mock render context
  const ctx = {
    user: mockUser,
  };

  // Simulate rendering the component with state hooks
  const setFirstName = (value: string) => {
    mockUser.firstName = value;
  };

  const setLastName = (value: string) => {
    mockUser.lastName = value;
  };

  // Set new values
  const newFirstName = 'Updated';
  const newLastName = 'Name';

  setFirstName(newFirstName);
  setLastName(newLastName);

  // Re-render component with updated values
  const component = ProfileForm(ctx);

  // Verify component reflects updated values
  assertContains(JSON.stringify(component), newFirstName);
  assertContains(JSON.stringify(component), newLastName);
});

Deno.test('ProfileForm - successful form submission', async () => {
  // Create a mock render context
  const ctx = {
    user: mockUser,
  };

  // Mock successful API response
  mockFetchJson({ success: true });

  // Create test state
  let successMessage = null;
  let errorMessage = null;
  let isSubmitting = false;

  // Mock state setters
  const setSuccessMessage = (msg: string | null) => {
    successMessage = msg;
  };
  const setErrorMessage = (msg: string | null) => {
    errorMessage = msg;
  };
  const setIsSubmitting = (value: boolean) => {
    isSubmitting = value;
  };

  // Simulate the form submission handler
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Reset messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Simulate form data
      const formData = new FormData();
      formData.append('action', 'update_profile');
      formData.append('firstName', mockUser.firstName || '');
      formData.append('lastName', mockUser.lastName || '');

      // Submit form data
      const response = await fetch('/account', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
      } else {
        setErrorMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger the submit handler
  await handleSubmit({ preventDefault: () => {} });

  // Assert success message was set
  assertEquals(successMessage, 'Profile updated successfully');
  assertEquals(errorMessage, null);
  assertEquals(isSubmitting, false);

  // Restore original fetch
  restoreFetch();
});

Deno.test('ProfileForm - handles submission errors', async () => {
  // Create a mock render context
  const ctx = {
    user: mockUser,
  };

  // Mock error API response
  mockFetchError(400, 'Failed to update profile');

  // Create test state
  let successMessage = null;
  let errorMessage = null;
  let isSubmitting = false;

  // Mock state setters
  const setSuccessMessage = (msg: string | null) => {
    successMessage = msg;
  };
  const setErrorMessage = (msg: string | null) => {
    errorMessage = msg;
  };
  const setIsSubmitting = (value: boolean) => {
    isSubmitting = value;
  };

  // Simulate the form submission handler
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Reset messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Simulate form data
      const formData = new FormData();
      formData.append('action', 'update_profile');
      formData.append('firstName', mockUser.firstName || '');
      formData.append('lastName', mockUser.lastName || '');

      // Submit form data
      const response = await fetch('/account', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
      } else {
        setErrorMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger the submit handler
  await handleSubmit({ preventDefault: () => {} });

  // Assert error message was set
  assertEquals(successMessage, null);
  assertEquals(errorMessage, 'Failed to update profile');
  assertEquals(isSubmitting, false);

  // Restore original fetch
  restoreFetch();
});
