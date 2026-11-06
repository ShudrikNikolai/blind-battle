import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('HEALTH')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Проверка работоспособности системы — процесс запущен.',
  })
  root() {
    return { status: 'ok' as const };
  }

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
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
    ]);
  }
}
