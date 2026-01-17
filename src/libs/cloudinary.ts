/* eslint-disable no-unused-vars */
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { env } from '@config/env.js';
import { InternalServerError } from './errors.js';
import Logger from '@config/logger.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';

export enum CloudinaryResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  RAW = 'raw',
  AUTO = 'auto',
}
export interface ICloudinaryUploadParams {
  localFilePath: string;
  resourceType?: CloudinaryResourceType;
  uploadFolder?: string;
  options?: UploadApiOptions;
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (
  params: ICloudinaryUploadParams,
): Promise<UploadApiResponse> => {
  const {
    localFilePath,
    resourceType = CloudinaryResourceType.IMAGE,
    uploadFolder = CLOUDINARY_FOLDER_NAME,
    options,
  } = params;
  Logger.debug(`Uploading file to Cloudinary. Resource Type: ${resourceType}`);

  if (!localFilePath) {
    Logger.warn('No local file path provided for file upload');
    throw new InternalServerError('No local file path provided');
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder: uploadFolder,
      resource_type: resourceType,
      ...options,
    });

    Logger.debug(`File uploaded to cloudinary: ${uploadResult?.public_id}`);

    return uploadResult;
  } catch (error) {
    Logger.error('Cloudinary File upload failed', error);
    throw new InternalServerError('Failed to upload file to Cloudinary');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    Logger.debug(`Preparing to delete image from Cloudinary: ${publicId}`);

    if (!publicId) {
      Logger.warn('No public id provided for image deletion');
      throw new InternalServerError('No public id provided');
    }

    Logger.debug(`Deleting image from cloudinary: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      Logger.error(`Image deletion returned unexpected result: ${result.result}`);
      throw new InternalServerError('Failed to delete image from Cloudinary');
    }

    Logger.info(`Image deleted from cloudinary: ${publicId}`);
  } catch (error) {
    Logger.error(`Cloudinary image delete failed for ID: ${publicId}`, error);
    throw new InternalServerError('Failed to delete image from Cloudinary');
  }
};
