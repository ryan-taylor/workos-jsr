/**
 * Exception for 400 Bad Request errors
 */
export class BadRequestException extends Error {
  code: string;
  errors: Array<{ field: string; code: string }>;
  override message: string;
  requestID: string;

  constructor(data: {
    code: string;
    errors?: Array<{ field: string; code: string }>;
    message: string;
    requestID: string;
  }) {
    super(data.message);
    this.name = "BadRequestException";
    this.code = data.code;
    this.errors = data.errors || [];
    this.message = data.message;
    this.requestID = data.requestID;
  }
}
