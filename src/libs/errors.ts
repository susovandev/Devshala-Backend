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
