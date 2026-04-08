import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe("AnalyticsController", () => {
  let controller: AnalyticsController;

  const mockService = {
    getSummary: jest.fn().mockResolvedValue({
      totalIncome: '100.00',
      totalExpense: '50.00',
      net: '50.00',
      byCategory: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it('should call service getSummary', async () => {
    const result = await mockService.getSummary(1, new Date(), new Date());

    expect(result.totalIncome).toBe('100.00');
  });
});