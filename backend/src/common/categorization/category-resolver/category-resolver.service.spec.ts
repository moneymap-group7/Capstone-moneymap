import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryResolverService } from './category-resolver.service';
import { RuleEngineService } from '../../../rules/rule-engine/rule-engine.service';
import { AutoCategorizeService } from '../auto-categorize.service';

describe('CategoryResolverService', () => {
  let service: CategoryResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryResolverService,
        {
          provide: RuleEngineService,
          useValue: {
            evaluate: jest.fn(),
          },
        },
        {
          provide: AutoCategorizeService,
          useValue: {
            categorize: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryResolverService>(CategoryResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});