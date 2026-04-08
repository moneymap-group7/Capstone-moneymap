import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    transaction: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getSummary should return correct values', async () => {
    mockPrismaService.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 100 } })
      .mockResolvedValueOnce({ _sum: { amount: -40 } });

    mockPrismaService.transaction.groupBy.mockResolvedValue([
      { spendCategory: 'FOOD', _sum: { amount: -20 } },
    ]);

    const result = await service.getSummary(1, new Date(), new Date());

    expect(result.totalIncome).toBe('100.00');
    expect(result.totalExpense).toBe('40.00');
    expect(result.net).toBe('60.00');
  });

  it('getByCategory should return items', async () => {
    mockPrismaService.transaction.groupBy.mockResolvedValue([
      {
        spendCategory: 'FOOD',
        _sum: { amount: -30 },
        _count: { _all: 2 },
      },
    ]);

    const result = await service.getByCategory(1, new Date(), new Date());

    expect(result.items.length).toBe(1);
    expect(result.items[0].count).toBe(2);
  });

  it('getMonthlySummary should return monthly data', async () => {
    mockPrismaService.transaction.findMany.mockResolvedValue([
      {
        transactionDate: new Date('2025-01-01'),
        amount: '100',
        transactionType: 'CREDIT',
        spendCategory: 'FOOD',
      },
      {
        transactionDate: new Date('2025-01-02'),
        amount: '-50',
        transactionType: 'DEBIT',
        spendCategory: 'FOOD',
      },
    ]);

    const result = await service.getMonthlySummary(
      1,
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );

    expect(result.monthly.length).toBeGreaterThan(0);
  });

  it('should call prisma correctly', async () => {
    mockPrismaService.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 10 } })
      .mockResolvedValueOnce({ _sum: { amount: -5 } });

    mockPrismaService.transaction.groupBy.mockResolvedValue([]);

    await service.getSummary(1, new Date(), new Date());

    expect(mockPrismaService.transaction.aggregate).toHaveBeenCalledTimes(2);
    expect(mockPrismaService.transaction.groupBy).toHaveBeenCalledTimes(1);
  });
});