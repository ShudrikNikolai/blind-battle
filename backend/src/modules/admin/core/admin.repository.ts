import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { AdminEntity } from './admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

@Injectable()
export class AdminRepository extends TypeOrmRepository<AdminEntity> {
  constructor(
    @InjectRepository(AdminEntity)
    protected readonly repository: Repository<AdminEntity>,
  ) {
    super(repository);
  }

  findByLogin(login: string): Promise<AdminEntity | null> {
    return this.findOne({ filter: { login } });
  }

  countUsable(): Promise<number> {
    return this.repository.count({
      where: { login: Not('seed-admin') },
    });
  }

  async createAdmin(login: string, passwordHash: string): Promise<AdminEntity> {
    return this.create({ login, passwordHash });
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const updPass = await this.update(id, { passwordHash });
    return !!updPass;
  }
}
