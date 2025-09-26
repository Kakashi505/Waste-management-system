import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseReportsService } from './enterprise-reports.service';
import { EnterpriseReportsController } from './enterprise-reports.controller';
import { ReportTemplate } from '../../database/entities/report-template.entity';
import { ScheduledReport } from '../../database/entities/scheduled-report.entity';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Bid } from '../../database/entities/bid.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportTemplate, ScheduledReport, Case, Carrier, Bid]),
  ],
  providers: [EnterpriseReportsService],
  controllers: [EnterpriseReportsController],
  exports: [EnterpriseReportsService],
})
export class EnterpriseReportsModule {}
