import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('HEALTH')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get('ping')
  @ApiOperation({
    summary: 'Проверка работоспособности системы — процесс запущен.',
  })
  ping() {
    return { status: 'ok' as const };
  }

  @Get('network')
  @HealthCheck()
  @ApiOperation({ summary: 'Проверка готовности — доступность внешней сети' })
  checkNetwork() {
    return this.health.check([
      () =>
        this.http.pingCheck('google', 'https://google.com', { timeout: 8000 }),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Проверка готовности — база данных доступна' })
  checkDb() {
    return this.healthService.checkDb();
  }
}
