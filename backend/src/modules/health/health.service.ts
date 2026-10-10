import { DatabaseService } from '@/infrastructure/database/database.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor(private readonly dbService: DatabaseService) {}

  async checkDb(): Promise<{ status: boolean }> {
    const db = await this.dbService.healthCheck();
    return { status: db };
  }
}
