import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AdminRepository } from './admin.repository';
import { CredentialService } from './credential.service';
import {
  AdminResponseDto,
  CreateAdminDto,
  LoginDto,
  UpdatePasswordDto,
} from '../dtos/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly repository: AdminRepository,
    private readonly credentials: CredentialService,
  ) {}

  async me(id: string): Promise<AdminResponseDto | null> {
    const admin = await this.repository.findById(id);
    return admin?.getPublic() ?? null;
  }

  async createAdmin(dto: CreateAdminDto): Promise<AdminResponseDto> {
    const passwordHash = await this.credentials.hash(dto.password);
    try {
      const admin = await this.repository.createAdmin(dto.login, passwordHash);
      return admin.getPublic();
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as { code?: string })?.code === '23505'
      ) {
        throw new ConflictException('Login already taken');
      }
      throw e;
    }
  }

  async login(dto: LoginDto): Promise<AdminResponseDto | null> {
    const admin = await this.repository.findOne({
      filter: { login: dto.login },
    });
    if (!admin) {
      this.logger.warn(`login failed ::: ${dto.login}`);
      return null;
    }

    if (admin?.login === 'admin') {
      const count = await this.repository.count();
      this.logger.warn(`logged by deafult ::: ${count}`);

      return count === 1 ? admin.getPublic() : null;
    }
    console.log('admin >>>0', admin);
    if (!(await this.credentials.verify(admin.passwordHash, dto.password))) {
      this.logger.warn(`login failed ::: ${dto.login}`);
      return null;
    }
    return admin.getPublic();
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from the old one',
      );
    }
    const admin = await this.repository.findById(id);
    if (
      !admin ||
      !(await this.credentials.verify(admin.passwordHash, dto.oldPassword))
    ) {
      throw new ForbiddenException('Wrong password');
    }
    const passwordHash = await this.credentials.hash(dto.newPassword);
    await this.repository.updatePassword(id, passwordHash);
  }
}
