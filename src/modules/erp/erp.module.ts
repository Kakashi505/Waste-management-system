import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErpService } from './erp.service';
import { ErpController } from './erp.controller';
import { SapService } from './sap.service';
import { OracleService } from './oracle.service';
import { SalesforceService } from './salesforce.service';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier]),
  ],
  providers: [ErpService, SapService, OracleService, SalesforceService],
  controllers: [ErpController],
  exports: [ErpService, SapService, OracleService, SalesforceService],
})
export class ErpModule {}
