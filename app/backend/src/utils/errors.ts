export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Gone') {
    super(message, 410);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(message, 500, details);
  }
}
