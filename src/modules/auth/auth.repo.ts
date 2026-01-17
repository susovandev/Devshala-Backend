import verificationCodeModel, {
  type IVerificationCodeDocument,
} from 'models/verificationCode.model.js';
import type { ICreateVerificationCodeParams } from './auth.types.js';

class AuthRepo {
  async createVerificationCode(
    params: ICreateVerificationCodeParams,
  ): Promise<IVerificationCodeDocument | null> {
    return await verificationCodeModel.create(params);
  }
}

export default new AuthRepo();
