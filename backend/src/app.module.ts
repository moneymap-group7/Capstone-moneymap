import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from './health/health.module';
import { StatementsModule } from "./statements/statements.module";
import { ConfigModule } from "@nestjs/config";


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
 AuthModule,     // ✅ auth lives here
    PrismaModule,   // ✅ database
    HealthModule,
     StatementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
