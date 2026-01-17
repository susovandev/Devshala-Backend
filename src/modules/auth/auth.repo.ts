import verificationCodeModel, {
  type IVerificationCodeDocument,
} from 'models/verificationCode.model.js';
import type {
  ICreateLoginRecordParam,
  ICreateRefreshTokenRecordParam,
  ICreateVerificationCodeParams,
  IGetVerificationCodeParams,
} from './auth.types.js';
import loginModel from 'models/login.model.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import Logger from '@config/logger.js';

class AuthRepo {
  async createVerificationCode(
    params: ICreateVerificationCodeParams,
  ): Promise<IVerificationCodeDocument | null> {
    Logger.debug('Creating verification code...');
    return await verificationCodeModel.create(params);
  }

  async findVerificationCode(
    params: IGetVerificationCodeParams,
  ): Promise<IVerificationCodeDocument | null> {
    Logger.debug('Finding verification code...');
    const { userId, verificationCodeHash, verificationType, verificationStatus } = params;
    return await verificationCodeModel.findOne({
      userId,
      verificationCode: verificationCodeHash,
      verificationType,
      verificationStatus,
    });
  }

  async createLoginRecord(params: ICreateLoginRecordParam) {
    Logger.debug('Creating login record...');
    return await loginModel.create(params);
  }

  async createRefreshTokenRecord(params: ICreateRefreshTokenRecordParam) {
    Logger.debug('Creating refresh token record...');
    return await refreshTokenModel.create(params);
  }
}

export default new AuthRepo();
