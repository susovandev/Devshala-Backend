import bcrypt from 'bcryptjs';

class AuthHelper {
  async hashPasswordHelper(password: string): Promise<string | null> {
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    if (!hashedPassword) return null;
    return hashedPassword;
  }

  generateRandomOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }
}

export default new AuthHelper();
