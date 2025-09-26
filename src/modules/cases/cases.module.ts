import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier]),
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  providers: [CasesService, MatchingService, MatchingProcessor],
  controllers: [CasesController],
  exports: [CasesService, MatchingService],
})
export class CasesModule {}
