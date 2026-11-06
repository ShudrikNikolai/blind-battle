import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCreateDto } from '../dtos/user.dto';

@Injectable()
export class UserRepository extends TypeOrmRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  async createIfNotExists(data: UserCreateDto): Promise<UserEntity> {
    // TODO
    await this.repository.upsert(data, { conflictPaths: ['telegramId'] });
    return (await this.findByTelegramId(data.telegramId))!;
  }

  async findByTelegramId(telegramId: string): Promise<UserEntity | null> {
    return this.findOne({ filter: { telegramId } });
  }

  async confirm(telegramId: string, phoneNumber: string): Promise<boolean> {
    const res = await this.repository.update(
      { telegramId, isConfirmed: false },
      { phoneNumber, isConfirmed: true },
    );
    return !!res.affected;
  }

  async setPendingInvite(telegramId: string, token: string): Promise<boolean> {
    const res = await this.repository.update(
      { telegramId },
      { pendingInviteToken: token },
    );
    return !!res.affected;
  }

  /** Атомарно забирает и очищает pending-токен. */
  async takePendingInvite(telegramId: string): Promise<string | null> {
    return this.repository.manager.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { telegramId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user?.pendingInviteToken) return null;

      const token = user.pendingInviteToken;
      await manager.update(
        UserEntity,
        { telegramId },
        { pendingInviteToken: null },
      );
      return token;
    });
  }
}
