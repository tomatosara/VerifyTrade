export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, details);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Gone', details?: unknown) {
    super(message, 410, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', details?: unknown) {
    super(message, 429, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(message, 500, details);
  }
}
