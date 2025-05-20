/**
 * Base application error class
 */
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * 400 Bad Request error
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", details?: unknown) {
    super(message, 400, code, details);
  }
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED", details?: unknown) {
    super(message, 401, code, details);
  }
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN", details?: unknown) {
    super(message, 403, code, details);
  }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND", details?: unknown) {
    super(message, 404, code, details);
  }
}

/**
 * 409 Conflict error
 */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code = "CONFLICT", details?: unknown) {
    super(message, 409, code, details);
  }
}

/**
 * 422 Unprocessable Entity error
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

/**
 * 429 Too Many Requests error
 */
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
