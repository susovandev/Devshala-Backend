import { StatusCodes } from 'http-status-codes';
export class HttpError extends Error {
  status: 'error' | 'fail';
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
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
