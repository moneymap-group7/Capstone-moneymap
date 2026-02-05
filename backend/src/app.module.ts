import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
 AuthModule,     
    PrismaModule,  
    HealthModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
