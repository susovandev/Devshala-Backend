import verificationCodeModel, {
  type IVerificationCodeDocument,
} from 'models/verificationCode.model.js';
import type { ICreateVerificationCodeParams, IGetVerificationCodeParams } from './auth.types.js';

class AuthRepo {
  async createVerificationCode(
    params: ICreateVerificationCodeParams,
  ): Promise<IVerificationCodeDocument | null> {
    return await verificationCodeModel.create(params);
  }

  async findVerificationCode(
    params: IGetVerificationCodeParams,
  ): Promise<IVerificationCodeDocument | null> {
    const { userId, verificationCodeHash, verificationType, verificationStatus } = params;
    return await verificationCodeModel.findOne({
      userId,
      verificationCode: verificationCodeHash,
      verificationType,
      verificationStatus,
    });
  }
}

export default new AuthRepo();
