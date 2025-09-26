import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { Bid } from '../../database/entities/bid.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Carrier, Bid]),
  ],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
