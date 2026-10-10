import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AdminService } from '../core/admin.service';
import type { AdminRepository } from '../core/admin.repository';
import type { CredentialService } from '../core/credential.service';
import type { AdminEntity } from '../core/admin.entity';

const makeAdmin = (
  over: Partial<{ id: string; login: string; passwordHash: string }> = {},
) => {
  const a = { id: 'admin-1', login: 'root', passwordHash: 'hash-old', ...over };
  return {
    ...a,
    getPublic: () => ({ id: a.id, login: a.login }),
  } as unknown as AdminEntity;
};

describe('AdminService', () => {
  let repo: Record<
    'findById' | 'findOne' | 'createAdmin' | 'updatePassword',
    Mock
  >;
  let credentials: Record<'hash' | 'verify', Mock>;
  let service: AdminService;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      findOne: vi.fn(),
      createAdmin: vi.fn(),
      updatePassword: vi.fn(),
    };
    credentials = { hash: vi.fn(), verify: vi.fn() };
    service = new AdminService(
      repo as unknown as AdminRepository,
      credentials as unknown as CredentialService,
    );
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('login', () => {
    it('returns public admin on valid credentials', async () => {
      repo.findOne.mockResolvedValue(makeAdmin());
      credentials.verify.mockResolvedValue(true);

      const res = await service.login({ login: 'root', password: 'secret123' });

      expect(res).toEqual({ id: 'admin-1', login: 'root' });
      expect(repo.findOne).toHaveBeenCalledWith({ filter: { login: 'root' } });
      expect(credentials.verify).toHaveBeenCalledWith('hash-old', 'secret123');
    });

    it('returns null and skips verify when admin does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await service.login({
        login: 'ghost',
        password: 'secret123',
      });

      expect(res).toBeNull();
      expect(credentials.verify).not.toHaveBeenCalled();
    });

    it('returns null on wrong password', async () => {
      repo.findOne.mockResolvedValue(makeAdmin());
      credentials.verify.mockResolvedValue(false);

      await expect(
        service.login({ login: 'root', password: 'wrong-pass' }),
      ).resolves.toBeNull();
    });
  });

  describe('createAdmin', () => {
    it('stores the hash, never the raw password', async () => {
      credentials.hash.mockResolvedValue('hashed');
      repo.createAdmin.mockResolvedValue(
        makeAdmin({ login: 'new', passwordHash: 'hashed' }),
      );

      const res = await service.createAdmin({
        login: 'new',
        password: 'password123',
      });

      expect(credentials.hash).toHaveBeenCalledWith('password123');
      expect(repo.createAdmin).toHaveBeenCalledWith('new', 'hashed');
      expect(res).toEqual({ id: 'admin-1', login: 'new' });
    });

    it('throws ConflictException when login is taken (23505)', async () => {
      credentials.hash.mockResolvedValue('hashed');
      repo.createAdmin.mockRejectedValue(
        new QueryFailedError(
          'INSERT INTO admins',
          [],
          Object.assign(new Error('duplicate key'), { code: '23505' }),
        ),
      );

      await expect(
        service.createAdmin({ login: 'root', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected errors', async () => {
      credentials.hash.mockResolvedValue('hashed');
      repo.createAdmin.mockRejectedValue(new Error('boom'));

      await expect(
        service.createAdmin({ login: 'x', password: 'password123' }),
      ).rejects.toThrow('boom');
    });
  });

  describe('updatePassword', () => {
    it('rejects when new password equals old one', async () => {
      await expect(
        service.updatePassword('admin-1', {
          oldPassword: 'same-pass-1',
          newPassword: 'same-pass-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('forbids when admin is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword('admin-1', {
          oldPassword: 'old-pass-1',
          newPassword: 'new-pass-1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids on wrong old password and changes nothing', async () => {
      repo.findById.mockResolvedValue(makeAdmin());
      credentials.verify.mockResolvedValue(false);

      await expect(
        service.updatePassword('admin-1', {
          oldPassword: 'wrong-pass',
          newPassword: 'new-pass-1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(credentials.hash).not.toHaveBeenCalled();
      expect(repo.updatePassword).not.toHaveBeenCalled();
    });

    it('saves the hash of the new password', async () => {
      repo.findById.mockResolvedValue(makeAdmin());
      credentials.verify.mockResolvedValue(true);
      credentials.hash.mockResolvedValue('new-hash');

      await service.updatePassword('admin-1', {
        oldPassword: 'old-pass-1',
        newPassword: 'new-pass-1',
      });

      expect(credentials.verify).toHaveBeenCalledWith('hash-old', 'old-pass-1');
      expect(credentials.hash).toHaveBeenCalledWith('new-pass-1');
      expect(repo.updatePassword).toHaveBeenCalledWith('admin-1', 'new-hash');
    });
  });

  describe('me', () => {
    it('returns public admin', async () => {
      repo.findById.mockResolvedValue(makeAdmin());
      await expect(service.me('admin-1')).resolves.toEqual({
        id: 'admin-1',
        login: 'root',
      });
    });

    it('returns null when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.me('nope')).resolves.toBeNull();
    });
  });
});
