export class ApiResponse<T> {
  public status: string;
  constructor(
    public statusCode: number,
    public message: string = 'OK',
    public data?: T,
  ) {
    this.status = 'success';
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
