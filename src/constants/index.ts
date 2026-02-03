export const REQUEST_BODY_LIMIT = '10KB';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const MULTER_UPLOAD_PATH = 'public/uploads';
export const CLOUDINARY_FOLDER_NAME = 'devshalauploads';

export const SESSION_MAX_AGE = 1000 * 60 * 60 * 24;

export const PASSWORD_HASH_SALT_ROUNDS = 10;
export const VERIFICATION_CODE_EXPIRATION_TIME = 5 * 60 * 1000; // 2 minutes

export const ACCESS_TOKEN_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RESET_PASSWORD_TOKEN_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes
