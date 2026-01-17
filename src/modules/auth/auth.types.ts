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
