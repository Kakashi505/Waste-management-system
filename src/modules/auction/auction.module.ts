import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Bid } from '../../database/entities/bid.entity';
import { Case } from '../../database/entities/case.entity';
import { Carrier } from '../../database/entities/carrier.entity';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { AuctionProcessor } from './auction.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Case, Carrier]),
    BullModule.registerQueue({
      name: 'auction',
    }),
  ],
  providers: [AuctionService, AuctionProcessor],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
