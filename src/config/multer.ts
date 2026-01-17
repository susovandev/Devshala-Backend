/* eslint-disable no-unused-vars */
import { Request } from 'express';
import multer from 'multer';
import path from 'node:path';
import { MULTER_UPLOAD_PATH, MAX_FILE_SIZE_BYTES } from 'constants/index.js';
import { env } from './env.js';

export function generateRandomString() {
  const companyName = env.SERVICE_NAME;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  let uniqueName = companyName;
  for (let i = 0; i < 10; i++) {
    uniqueName += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return uniqueName;
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (_error: Error | null, destination: string) => void,
  ) => {
    cb(null, MULTER_UPLOAD_PATH);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueName = generateRandomString();
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export { upload };
