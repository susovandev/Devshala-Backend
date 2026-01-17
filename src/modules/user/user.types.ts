export interface IGetUserParams {
  username: string;
  email: string;
}

export interface ICreateUserParams {
  username: string;
  email: string;
  passwordHash: string;
}
