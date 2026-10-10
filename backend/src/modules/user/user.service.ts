import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserCreateDto, ResponseDto, UserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}
  private readonly logger = new Logger(UserService.name);

  async register(data: UserCreateDto): Promise<UserDto> {
    const user = await this.repository.createIfNotExists(data);
    return user.getPublic();
  }

  async findById(id: string): Promise<ResponseDto> {
    const user = await this.repository.findById(id);
    if (!user) {
      this.logger.warn(`findById::: ${id} ::: not found`);
      return null;
    }
    return user.getPublic();
  }

  async findByTelegramId(telegramId: string): Promise<ResponseDto> {
    const user = await this.repository.findByTelegramId(telegramId);
    if (!user) {
      this.logger.warn(`findByTelegramId::: ${telegramId} ::: not found`);
      return null;
    }
    return user.getPublic();
  }

  async confirm(telegramId: string, phoneNumber: string): Promise<boolean> {
    const isConfirm = await this.repository.confirm(telegramId, phoneNumber);
    if (!isConfirm) {
      this.logger.warn(
        `confirm::: ${telegramId} ::: not found or already confirmed`,
      );
    }
    return isConfirm;
  }
}
