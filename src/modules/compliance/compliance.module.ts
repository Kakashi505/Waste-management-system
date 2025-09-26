import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { GdprService } from './gdpr.service';
import { Iso27001Service } from './iso27001.service';
import { Soc2Service } from './soc2.service';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [ComplianceService, GdprService, Iso27001Service, Soc2Service],
  controllers: [ComplianceController],
  exports: [ComplianceService, GdprService, Iso27001Service, Soc2Service],
})
export class ComplianceModule {}
