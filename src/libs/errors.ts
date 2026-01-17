import { StatusCodes } from 'http-status-codes';
export class HttpError extends Error {
  status: 'error' | 'fail';
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.status = 'error';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(StatusCodes.BAD_REQUEST, message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(StatusCodes.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(StatusCodes.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', details?: unknown) {
    super(StatusCodes.NOT_FOUND, message, details);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', details?: unknown) {
    super(StatusCodes.CONFLICT, message, details);
  }
}
