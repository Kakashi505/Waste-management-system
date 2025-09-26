import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CasesModule } from './modules/cases/cases.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { PhotosModule } from './modules/photos/photos.module';
import { GpsModule } from './modules/gps/gps.module';
import { AuctionModule } from './modules/auction/auction.module';
import { JwnetModule } from './modules/jwnet/jwnet.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CacheModule } from './modules/cache/cache.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SecurityModule } from './modules/security/security.module';
import { SsoModule } from './modules/sso/sso.module';
import { EnterpriseReportsModule } from './modules/enterprise-reports/enterprise-reports.module';
import { ApiManagementModule } from './modules/api-management/api-management.module';
import { ErpModule } from './modules/erp/erp.module';
import { IotModule } from './modules/iot/iot.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { BackupModule } from './modules/backup/backup.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { OptimizationModule } from './modules/optimization/optimization.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'waste_management',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CasesModule,
    CarriersModule,
    PhotosModule,
    GpsModule,
    AuctionModule,
    JwnetModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    AnalyticsModule,
    AiModule,
    IntegrationsModule,
    CacheModule,
    TenantsModule,
    SecurityModule,
    SsoModule,
    EnterpriseReportsModule,
    ApiManagementModule,
    ErpModule,
    IotModule,
    MonitoringModule,
    BackupModule,
    ComplianceModule,
    OptimizationModule,
    HealthModule,
  ],
})
export class AppModule {}
