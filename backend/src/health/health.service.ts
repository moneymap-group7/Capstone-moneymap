import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  basic() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async db() {
    try {
      // Prisma raw query to confirm DB is reachable
      await this.prisma.$executeRawUnsafe('SELECT 1');
      return {
        status: 'ok',
        db: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
