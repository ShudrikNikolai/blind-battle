import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CredentialService } from '../core/credential.service';

const service = new CredentialService();
const LEGACY_BCRYPT =
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FbPGUMi7LtE5kM3/2pLOhuJbYa7K8tW';

describe('CredentialService', () => {
  it('hashes and verifies with argon2', async () => {
    const hash = await service.hash('secret');

    await expect(service.verify(hash, 'secret')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });

  it('rejects the legacy bcrypt seed without throwing', async () => {
    await expect(service.verify(LEGACY_BCRYPT, 'admin')).resolves.toBe(false);
  });

  it('requires both hash and raw password', async () => {
    await expect(service.verify('', 'secret')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.verify('hash', '')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
