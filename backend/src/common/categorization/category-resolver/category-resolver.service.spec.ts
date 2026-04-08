import { Test, TestingModule } from '@nestjs/testing';
import { CategoryResolverService } from './category-resolver.service';

describe('CategoryResolverService', () => {
  let service: CategoryResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryResolverService],
    }).compile();

    service = module.get<CategoryResolverService>(CategoryResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
