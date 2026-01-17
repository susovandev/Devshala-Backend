/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HttpError } from '@libs/errors.js';
import Logger from '@config/logger.js';
import { env } from '@config/env.js';

export interface NormalizedError {
  statusCode: number;
  status: 'error' | 'fail';
  message: string;
  details?: unknown;
}

export const normalizeError = (err: any): NormalizedError => {
  // Custom HTTP errors
  if (err instanceof HttpError) {
    return {
      statusCode: err.statusCode,
      status: err.status,
      message: err.message,
      details: err.details,
    };
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    return {
      statusCode: StatusCodes.CONFLICT,
      status: 'fail',
      message: 'Duplicate field value',
      details: Object.keys(err.keyValue),
    };
  }

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      status: 'fail',
      message: 'Invalid request data',
      details: Object.values(err.errors).map((e) => e.message),
    };
  }

  // Mongoose cast error
  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      status: 'fail',
      message: `Invalid value for ${err.path}`,
      details: err.value,
    };
  }

  // Fallback (safe)
  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    status: 'error',
    message: 'Internal Server Error',
    details: env.NODE_ENV === 'development' ? err.message : undefined,
  };
};

export const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const normalized = normalizeError(err);

  const status = normalized.statusCode >= 500 ? 'error' : 'fail';

  Logger.error(`${normalized.statusCode} - ${normalized.message} - ${req.ip}`, {
    stack: err.stack,
  });

  res.status(normalized.statusCode).json({
    statusCode: normalized.statusCode,
    status,
    message: normalized.message,
    details: normalized.details,
  });
};
