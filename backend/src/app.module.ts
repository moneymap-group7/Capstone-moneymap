import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { StatementsModule } from "./statements/statements.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { CategoriesModule } from './categories/categories.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ParsingModule } from "./parsing/parsing.module";
import { RulesModule } from './rules/rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute per IP
      },
    ]),

    AuthModule,
    PrismaModule,
    HealthModule,
    ParsingModule,
    StatementsModule,
    TransactionsModule,
    CategoriesModule,
    AnalyticsModule,
    BudgetsModule,
    RulesModule,
    
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
