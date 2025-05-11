/**
 * Interface for standardized WorkOS API error responses
 */
export interface WorkOSResponseError {
  /**
   * Error code string, used to identify the type of error
   */
  code?: string;
  
  /**
   * Error message explaining what went wrong
   */
  message?: string;
  
  /**
   * Error identifier, typically used in OAuth errors
   */
  error?: string;
  
  /**
   * Detailed error description for OAuth errors
   */
  error_description?: string;
  
  /**
   * List of validation errors for code 422 (Unprocessable Entity) errors
   */
  errors?: Array<{
    attribute: string;
    code: string;
    message: string;
  }>;
}
