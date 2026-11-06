import { Module } from '@nestjs/common';
import { UserService } from './core/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './core/user.entity';
import { UserRepository } from './core/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
