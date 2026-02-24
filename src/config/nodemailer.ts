import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  service: env.MAIL_SERVICE,
  host: env.MAIL_HOST,
  port: Number(env.MAIL_PORT),
  secure: Number(env.MAIL_PORT) === 587,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
});

export default transporter;
