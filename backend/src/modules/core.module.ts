import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

const modules = [HealthModule, AdminModule];

@Module({
  imports: modules,
  exports: modules,
})
export class CoreModule {}
