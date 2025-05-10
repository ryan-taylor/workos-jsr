import { UnprocessableEntityError } from './unprocessable-entity-error.interface.ts';

export interface WorkOSResponseError {
  code?: string;
  error_description?: string;
  error?: string;
  errors?: UnprocessableEntityError[];
  message: string;
}
