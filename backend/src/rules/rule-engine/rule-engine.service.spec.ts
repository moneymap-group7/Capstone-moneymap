import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RuleEngineService } from './rule-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RuleEngineService', () => {
  let service: RuleEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: PrismaService,
          useValue: {
            userCategoryRule: {
              findMany: jest.fn(),
            },
            transaction: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});