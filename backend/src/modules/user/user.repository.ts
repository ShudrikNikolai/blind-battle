import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCreateDto } from './user.dto';

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
}
