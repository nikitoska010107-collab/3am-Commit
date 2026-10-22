import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { validateEnv } from './config/env'
import { AppConfigModule } from './config/config.module'
import { PrismaModule } from './prisma/prisma.module'
import { AuditModule } from './modules/audit/audit.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProductsModule } from './modules/products/products.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { MocksModule } from './modules/mocks/mocks.module'
import { CreditHistoryModule } from './modules/credit-history/credit-history.module'
import { ScoringModule } from './modules/scoring/scoring.module'
import { BankModule } from './modules/bank/bank.module'
import { HealthController } from './modules/health/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),
    AppConfigModule,
    PrismaModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    ProductsModule,
    ApplicationsModule,
    DocumentsModule,
    MocksModule,
    CreditHistoryModule,
    ScoringModule,
    BankModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
