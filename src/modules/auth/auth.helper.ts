import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

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

  hashVerificationCodeHelper(verificationCode: string): string | null {
    const verificationCodeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    if (!verificationCodeHash) return null;
    return verificationCodeHash;
  }
}

export default new AuthHelper();
