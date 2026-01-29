import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.basic();
  }

  @Get('db')
  async getDbHealth() {
    return await this.healthService.db();
  }
}
