import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { StatementsModule } from "./statements/statements.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { CategoriesModule } from './categories/categories.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    StatementsModule,
    TransactionsModule,
    CategoriesModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
