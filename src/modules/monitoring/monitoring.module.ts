import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { AlertingService } from './alerting.service';
import { LoggingService } from './logging.service';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [MonitoringService, MetricsService, AlertingService, LoggingService],
  controllers: [MonitoringController],
  exports: [MonitoringService, MetricsService, AlertingService, LoggingService],
})
export class MonitoringModule {}
