import request from 'supertest';
import { describe, it, expect } from 'vitest';
import initializeExpressApplication from '../../app.js';
import { env } from '../../config/env.js';

const app = initializeExpressApplication();

describe('Healthcheck Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/healthcheck');

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      message: 'Up and running',
      status: 'success',
      statusCode: 200,
      data: {
        serviceName: env.SERVICE_NAME,
        environment: env.NODE_ENV,
        version: env.API_VERSION,
        uptime: expect.any(Number),
        timestamp: expect.any(Number),
        processId: expect.any(Number),
      },
    });
  });
});
