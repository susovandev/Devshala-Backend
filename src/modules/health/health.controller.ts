import { StatusCodes } from 'http-status-codes';
import { env } from '@config/env.js';
import type { Request, Response } from 'express';

/**
 * Health check controller
 * @param {Request} _req Express request object
 * @param {Response} res Express response object
 * @returns {Promise<Response>} Promise resolving with an Express response object
 * @description Returns a JSON response with application status information
 */
export default async function healthCheckHandler(_req: Request, res: Response): Promise<Response> {
  return res.status(StatusCodes.OK).json({
    status: 'success',
    statusCode: StatusCodes.OK,
    message: 'Up and running',
    data: {
      serviceName: env.SERVICE_NAME,
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      uptime: process.uptime(),
      timestamp: Date.now(),
      processId: process.pid,
    },
  });
}
