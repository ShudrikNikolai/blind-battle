import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class CredentialService {
  async hash(raw: string): Promise<string> {
    if (!raw) {
      throw new BadRequestException('Password is required');
    }
    try {
      return await argon2.hash(raw);
    } catch (error) {
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  async verify(hash: string, raw: string): Promise<boolean> {
    if (!hash || !raw) {
      throw new BadRequestException('Hash and password are required');
    }
    try {
      return await argon2.verify(hash, raw);
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify password');
    }
  }
}
