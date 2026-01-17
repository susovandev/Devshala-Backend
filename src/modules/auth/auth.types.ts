export interface ISignupRequestBody {
  username: string;
  email: string;
  password: string;
}

export interface ICreateVerificationCodeParams {
  userId: string;
  verificationCode: string;
  verificationCodeExpiration: Date;
  verificationType: string;
}

export interface IVerifyEmailRequestBody {
  userId: string;
  verificationCode: string;
}

export interface IGetVerificationCodeParams {
  userId: string;
  verificationCodeHash: string;
  verificationType: string;
  verificationStatus: string;
}
